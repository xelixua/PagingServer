//getting phones IP from CUCM 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var https	= require('https');
var fs		= require('fs');
var xml2js      = require('xml2js');

var phones_data;

//fetching data from CUCM Risport
function send_push_cucm(ip,push_file,callback_func){
	var date = new Date();
	
	fs.readFile(push_file, {encoding:'utf8'},function (err, data){
		var date = new Date();
		if (err) throw err;
		
		var uname='USERNAME';
		var password='PASSWORD';
		var output = data;
		var options = {
			hostname: ip,
			port: 8443,
			path: '/realtimeservice/services/RisPort',
			method: 'POST',
			headers: {
				'Content-Length': Buffer.byteLength(output),
	            'Authorization': 'Basic ' + new Buffer(uname + ':' + password).toString('base64'),
	            'Content-Type':'text/xml',
			    'SOAPAction': 'http://schemas.cisco.com/ast/soap/action/#RisPort#SelectCmDevice',
			}
		};
		var req = https.request(options, function(res) {
               var date = new Date();
				fs.writeFile('cucm_data.xml','');
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
					 fs.appendFile('cucm_data.xml',chunk);
                                });
                                if(callback_func) callback_func();
		});
		
                    req.on('error', function(e){
                         var date = new Date();
                         console.log(date+':'+ip+': CUCM Problem with request: ' + e.message);
                    });
               req.write(output);
        });
}

function get_phone_ip(ext,callback){
	var date = new Date();
	var xml = phones_data;
	var parser = new xml2js.Parser({ignoreAttrs:true});
	parser.parseString(xml, function (err, result) {
		if(err) throw err;
		if(typeof(result)!='undefined'){
			var cisco_phones=result['soapenv:Envelope']['soapenv:Body'][0]['ns1:SelectCmDeviceResponse'][0]
				['SelectCmDeviceResult'][0]['CmNodes'][0]['item'] [0]['CmDevices'][0]['item'];
				
			for (var i=0;i<cisco_phones.length-1;i++){
				if(ext==cisco_phones[i]['DirNumber'][0].substr(0,4)){
					var ip = cisco_phones[i]['IpAddress'][0];
					callback(ip);
					break;
				}
			}
		} else {
			console.log(date+': WRONG RESULT: '+result);
		}
	});
}

send_push_cucm('192.168.1.101','cucm_axl/risport.xml');
fs.readFile('cucm_data.xml',function(err,data){
	if(err) throw err;
	phones_data=data;
});
setInterval(function(){
		send_push_cucm('192.168.1.101','cucm_axl/risport.xml');
		fs.readFile('cucm_data.xml',function(err,data){
	        if(err) throw err;
	        phones_data=data;
	})
},60000);
exports.get_phone_ip=get_phone_ip;
