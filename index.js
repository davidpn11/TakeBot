
'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const lime = require('lime-js')
const messaginghub = require('messaginghub-client');
const WebSocketTransport = require('lime-transport-websocket');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient,
    assert = require('assert');


var port = process.env.PORT || 5000;

app.set('port', port)


var user_data = {};
user_data.step = 1;

//setting up express
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


MongoClient.connect('mongodb://localhost:27017/autoja', function(err, db) {

	    assert.equal(err, null);
	    console.log("Successfully connected to MongoDB.");

	    //-------------------db functions-------------------
	    function insereCliente(json){
		    db.collection("cliente").insertOne(json, function(err, res) {
	            console.log("Novo usuário_id: " + res.insertedId + "\n");
	            json._id = res.insertedId;
	        });
	    }

	    function getClientes(cpf) {
	    	db.collection('cliente').find().toArray(function(err, docs) {
             	assert.equal(err, null);
	     		console.log(JSON.stringify(docs));                                           
     		});
	    }

	    function getByCPF(cpf) {
	    	db.collection('cliente').find({"cpf":cpf}).toArray(function(err, docs) {
            	assert.equal(err, null);
	     		console.log(JSON.stringify(docs));                                           
	     		if(docs.length == 1){	     	     		
	     			return docs[0];
	     		}	     		
        	});
	    }


	// -------------------Routes---------------
	app.get('/', function (req, res) {
	    
	    res.send("Hello, I'm a bot")
	})

	app.get('/webhook/', function(req, res) {

	})

	app.post('/webhook/', function(req, res) {

	})


	//-------------------credenciais-------------------
	var identifier = 'gama01';
	var accessKey = 'RHhGaHdQaklWYnIzSm1OenpIT1A=';

	//-------------------cliente-------------------
	var client = new messaginghub.ClientBuilder()
	    .withIdentifier(identifier)
	    .withAccessKey(accessKey)
	    .withTransportFactory(() => new WebSocketTransport())
	    .build();

	client.connect() 
	.then(function(session) {
		console.log("session started");
	    
	})
	.catch(function(err) { console.log("falha de conexão"); });

	// Registra um receiver para mensagens do tipo 'text/plain'
	client.addMessageReceiver('text/plain', function(message) {	
	    botSteps(message);   
	});


	// Registra um receiver para qualquer notificação
	client.addNotificationReceiver(true, function(notification) {
	    // TODO: Processe a notificação recebida
	});


	//send message
	function sendMessageToUser(message) {    
	    client.sendMessage(message);
	};

	//user msg builder
	function buildMessage(messageTo,messageText,messageOptions){

	    if(messageOptions){
	    	var options = [];

		    	for(var i =0 ; i < messageOptions.length;i++){
		        	var obj = {"text":messageOptions[i]};
		        	options.push(obj);
		    	}

	    		var msgContent = {
					"text": messageText,
	                "options": options,
	            };
		}else{
			var msgContent = messageText
		}	

		
	    var message = {
	                "id": "311F87C0-F938-4FF3-991A-7C5AEF7771A5",
	                "to": messageTo,
	                "type": "application/vnd.lime.select+json",
	                "content": msgContent
	            };

	    return message;
	}
	    

function botSteps(message) {
	switch(user_data.step){
		case 1:
			stepProfile(message);
			break;
		case 2:
			stepConfirmation(message);
			break;
		case 3:
			stepAnalysis(message);
			break;
		case 3:
			stepProposal(message);
			break;
	}
}


function stepProfile(message){
		
	    switch (message.content) {	    	
	        case "Começar":
	        	sendMessageToUser({
	                type: "text/plain",
	                content: "Olá, eu sou o AutoBot. Antes de começarmos, gostaria de verificar algumas informações. Você poderia informar o seu nome completo?",
	                to: message.from
	            });	            
	            break;
	            
	        default:
	        	user_data.nome = message.content.toLowerCase();
	        	user_data.step = 2;
		        sendMessageToUser({
		                type: "text/plain",
		                content: "Ótimo. E poderia confirmar o seu CPF?",
		                to: message.from
		            });	            
		            break;	        
	    }
}


function stepConfirmation(message) {
	switch (message.content) {	    	
	        case "Começar":
	        	sendMessageToUser({
	                type: "text/plain",
	                content: "Olá, eu sou o AutoBot. Antes de começarmos, gostaria de verificar algumas informações. Você poderia informar o seu nome completo?",
	                to: message.from
	            });	            
	            break;
	            
	        default:
	        	user_data.nome = message.content.toLowerCase();
	        	user_data.step = 2;
		        sendMessageToUser({
		                type: "text/plain",
		                content: "Ótimo. E poderia confirmar o seu CPF?",
		                to: message.from
		            });	            
		            break;	        
	    }
}


	var switchMessages = function(message) {
	 	var messageToSend;
	    switch (message.content) {
	    	case "Começar":
	            messageToSend = buildMessage(message.from,"Olá, eu sou o AutoBot. Vamos começar",["sim","nao"]);
	            console.log(messageToSend);
	            sendMessageToUser(messageToSend);
	            var msg = {  
	  "id": "9",
	  "to": "postmaster@ai.msging.net",
	  "method": "set",
	  "uri": "/analysis",
	  "type": "application/vnd.iris.ai.analysis-request+json",
	  "resource": {
	    "text":"Quero uma pizza marguerita"
	  		}
		};
	  	sendMessageToUser(msg);
	            break;
	        default:
	        	sendMessageToUser({
	                type: "text/plain",
	                content: "Ok, se mudar de ideia estarei aqui.",
	                to: message.from
	            });
	            
	    }
	};

	//run server
	app.listen(app.get('port'), function() {
	    console.log('running on port', app.get('port'))
	    getClientes();
	    getByCPF("106.303.836-77");
	})
});