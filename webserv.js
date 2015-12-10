var http	 = require('http');
var url 	 = require('url');
var querystring	 = require('querystring');
var fs		 = require('fs');
var send_push_cisco = require('./main_wml.js').send_push_cisco;
var get_phone_ip    = require('./main_cisco_risport.js').get_phone_ip;

var check_busyness_timeout=5000; //5 seconds

var pageids=[];
pageids[0]='localhost';

var myip = '192.168.1.100';

function onRequest(request,response){
  var date = new Date();
  var request_command=url.parse(request.url).pathname;
  console.log(date+': REQUEST: '+request_command+' '+request.connection.remoteAddress);
  switch(request_command){
	 case '/page': { //getting page to numbers and starting paging
  			 var initiator=request.connection.remoteAddress;
			 var phone_model;
			 var param_string=url.parse(request.url).query;
		 	 var phone_request=querystring.parse(param_string);

			 if(phone_request){
				  phones = phone_request['list'].split('p');

		 		  response.writeHead(200,{'Content-Type':'text/xml'});
  				  fs.readFile('push_cisco_melody3.xml',{encoding:'utf8'},function (err,data){
					if (err) throw err;

					for(var i=0;i<phones.length;i++){
						get_phone_ip(phones[i],function(ip){
				                              send_push_cisco(ip,'push_cisco_melody.xml',false,
			        	                         send_push_cisco(ip,'push_cisco_pagerx.xml',false)
			                	                  )
				        });
					}
					response.end(data);

					send_push_cisco(initiator,'push_cisco_pagetx_old.xml',false);
                    setTimeout(function(){
										check_busyness(param_string,initiator,phones);
	                                                 },check_busyness_timeout);
				});
		}
		else{
			console.log(date+': ERROR - parameters not specified');
		}
		break;
	  }
	  case '/stoppage':{
			var initiator = request.connection.remoteAddress;
			var param_string=url.parse(request.url).query;
       	             	var phone_request=querystring.parse(param_string);

                        if(phone_request){
				phones = phone_request['list'].split('p');
					for(var i=0;i<phones.length;i++){
						get_phone_ip(phones[i], function(ip){
			        	        	send_push_cisco(ip,'push_cisco_pagestop.xml',false,
	        		        	             	send_push_cisco(ip,'push_cisco_melody2.xml',false))
					        });
					}
			}
			response.end();
			break;
	  }
	  case '/test':{
				fs.readFile('push_cisco_melody3.xml',{encoding:'utf8'},function(err,data){
                                	if (err) throw err;
	                                response.writeHead(200, {'Content-Type': 'text/xml'});
        	                        response.end(data);
					console.log(data);
                	        });

				get_phone_ip('2006',function(ip){
                	                send_push_cisco(ip,'push_cisco_melody.xml',false)
                	        });
				get_phone_ip('2008',function(ip){
                	                send_push_cisco(ip,'push_cisco_melody.xml',false)
        	                });
				get_phone_ip('2004',function(ip){
                	                send_push_cisco(ip,'push_cisco_rtptx_test.xml',false)
	                        });
				break;


	  }
	  default:{ 
		  	response.writeHead(200, {'Content-Type': 'text/plain'});
			response.end('AUTHORIZED');
			break;
	    }
	}
}

//determine if IP phone still transmitting/receiving
function check_busyness(param_string,initiator,receiving_phones,status_code){
	var date = new Date();
	console.log(param_string);
	if(status_code===undefined){
		console.log(date+': Trying to initiate another MTx on initiators phone...');
		send_push_cisco(initiator,'push_cisco_pagetx_old.xml',false,
			function(p1,p2,p3,p4){
				check_busyness(p1,p2,p3,p4);
			},receiving_phones,param_string);
		
	}
	else{
		if(status_code=='400'){
			console.log(date+' : initiators phone is still transmitting RTP.Next check in 5 secs...');
			setTimeout(function(){
				check_busyness(param_string,initiator,receiving_phones);
			},5000);
		}
		else{
			send_push_cisco(initiator,'push_cisco_pagestoptx.xml',false);
			console.log(date+': initiators phone stopped transmission.Stopping MRx on receiving phones');
			var options = {
	                   hostname: myip,
	                   port: 7777,
	                   path: '/stoppage?'+param_string,
	                   method: 'GET'
	                };
	
	                var req = http.get(options);
	
	                req.on('error', function(e){
	                         var date = new Date();
	                         console.log(date+': Problem with self request: ' + e.message);
        	        });
		}
	}
}

http.createServer(onRequest).listen(7777, myip);
console.log('Server running at http://'+myip+':7777/');
