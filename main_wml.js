//working with IP phones Push interface
var http 	= require('http');
var fs		= require('fs');
var request 	= require('request');

//sending xml data to IP phone Push interface
function send_push_cisco(ip,push_file,init,callback_func,receiving_phones,param_string,health_check,ext) {
    var date = new Date();
	
	if (init) {
		push_file='push_cisco_init.xml';
	}
	
	fs.readFile(push_file,function (err, data) {
		var date = new Date();
        if (err) throw err;
		var encoded_data=encodeURIComponent(data);
		var uname='UNAME';
		var password='PASSWORD';
		var output = 'XML='+encoded_data;
		var options = {
			hostname: ip,
            port: 80,
            path: '/CGI/Execute',
            method: 'POST',
            headers: {
                'Content-Length': Buffer.byteLength(output),
				'Authorization': 'Basic ' + new Buffer(uname + ':' + password).toString('base64'),
				'Content-Type':'text/xml',
            }
        };
		var response = '';
		var req = http.request(options, function(res) {
			var date = new Date();
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
					response+=chunk;
            });
			res.on('end',function() {
				if (response.search('already active')!= -1) {
					if (callback_func) {
						if (receiving_phones&&param_string) {
							var status_code=400;
							callback_func(param_string,ip,receiving_phones,status_code);
						} else {
							setTimeout(callback_func(),400);
						}
					}
				} else {
					if (callback_func) {
						if (receiving_phones&&param_string) {
							var status_code=res.statusCode;
	                        callback_func(param_string,ip,receiving_phones,status_code);
						} else {
							setTimeout(callback_func(),400);
						}
					}
				}
			});
		});
		
		req.on('error', function(e) {
			var date = new Date();
			console.log(date+':'+ip+': CISCO Problem with request: ' + e.message);
		});
		req.write(output);
    });
}

exports.send_push_cisco=send_push_cisco;
