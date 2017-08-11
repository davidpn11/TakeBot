
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
var taxa = 1.0265287;
var user_proposal = [];

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

	    function getByCPF(cpf,callback) {
	    	db.collection('cliente').find({"cpf":cpf}).toArray(function(err, docs) {            		    	
            	if(err) {       
		            callback(err);
        		}	     		        		
	     		callback(null,docs[0]);	     		
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

	function calculateProposal1() {
		var juros = Math.pow(taxa,user_data.parcelas_atrasadas);
		var desconto = user_data.valor_total*juros - user_data.valor_total;
		var s = "Para te ajudar eu posso te dar um desconto de R$"+ desconto.toFixed(2)+". Que tal?";
		user_proposal[0] = "desconto de R$"+ desconto.toFixed(2);		
		return s;
	}	



	
	function calculateProposal2() {
		var juros = Math.pow(taxa,user_data.parcelas_atrasadas);
		var novo_valor = user_data.valor_total*juros;		
		user_data.valor_total = novo_valor;		
		var valor_parcela = user_data.valor_total/user_data.parcelas_restantes;	
		var dif_parcelas = 60 - user_data.parcelas_restantes;
		var nova_parcela = novo_valor/60;
		var dif_valor_parcela = valor_parcela - nova_parcela;
		var s = "A gente diminui a parcela em R$"+dif_valor_parcela.toFixed(2)+" e estendemos o prazo por mais "+dif_parcelas+" meses.";// a partir de hoje ("+). Que tal?";
		user_proposal[1] = "R$"+nova_parcela.toFixed(2)+" x 60 meses";
		return s; 
	}

	
	
	function buildProposals(message) {

		var items = [];

		if(user_data.categoria == "C"){
			items = [
            {
                "header": {
                    "type": "application/vnd.lime.media-link+json",
                    "value": {
                        "title": "Proposta 1",
                        "text": calculateProposal1(),                      
                    }
                },
                 "options": [          
	            	{
		                "label": {
		                    "type": "text/plain",
		                    "value": "Proposta 1"
		                }
	            	}
        		]
            },
            {
                "header": {
                    "type": "application/vnd.lime.media-link+json",
                    "value": {
                        "title": "Proposta 2",
                        "text": calculateProposal2(),                      
                    }
                },
                 "options": [          
	            	{
		                "label": {
		                    "type": "text/plain",
		                    "value": "Proposta 2"
		                }
	            	}
        		]
            }
        ];

		}else{

			items = [
		            {
		                "header": {
		                    "type": "application/vnd.lime.media-link+json",
		                    "value": {
		                        "title": "Proposta 1",
		                        "text": calculateProposal1(),                      
		                    }
		                },
		                 "options": [          
			            	{
				                "label": {
				                    "type": "text/plain",
				                    "value": "Proposta 1"
				                }
			            	}
		        		]
		            }
        		];
            }
       

			var message ={
		    "id": "1",
		    "to": message.from,
		"type": "application/vnd.lime.collection+json",
    "content": {
        "itemType": "application/vnd.lime.document-select+json",
        "items": items
    	}
		};
		return message;
	
	}


	    

function botSteps(message) {
	console.log("step: "+user_data.step);
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
		case 4:
			stepProposal(message);
			break;		
		case 5:
			stepNotificationConfirmation(message);
			break;	
		case 6:
			stepPayment(message);
			break;	
		case 7:
			stepHandleProposals(message);
			break;	
		case 8:
			stepFinishProposal(message);
			break;	
	}
}


function stepProfile(message){
		
	    switch (message.content) {	    	
	        case "Começar":
	        	sendMessageToUser({
	                type: "text/plain",
	                content: "Olá, eu sou a Jess! Antes de começarmos, você poderia informar o seu nome completo?",
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
	console.log("conformation");
	 switch (message.content) {	    
	 	default:

			getByCPF(message.content, function(err,docs){
				
				if(err){
					console.log("erro"+err);
				}

				if(docs == undefined){					
					console.log("Nope");
					sendMessageToUser({
			            type: "text/plain",
			            content: "Este CPF é inválido! Tente preencher no formato XXX.XXX.XXX-XX",
			            to: message.from
		  	        });	            		        			
				}else{
					console.log("achou");
					if(user_data.nome == docs.nome.toLowerCase()){
						console.log("Encontrou");						

						sendMessageToUser({
				            type: "text/plain",
				            content: "Ótimo, encontrei seu cadastro!",
				            to: message.from
				        });
				        user_data = docs;
				        console.log(JSON.stringify(user_data));

	 					switch(docs.categoria){
							//OK
							case "A":
								var text = "Acabei de ver que você está em dia com seus débitos, parabéns! O que gostaria de fazer?";
								var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);	    
								sendMessageToUser(messageToSend);
					           	user_data.step = 3;
								break;

							case "B":
								var text = "Verifquei que você tem algumas pendências. Gostaria de negociá-las?";
								var messageToSend = buildMessage(message.from,text,["Sim", "Não"]);	    			
								sendMessageToUser(messageToSend);
					           	user_data.step = 4;
								break;
							case "C":
								var text = "Verifquei que você tem algumas pendências. Gostaria de negociá-las?";
								var messageToSend = buildMessage(message.from,text,["Sim", "Não"]);	    			
								sendMessageToUser(messageToSend);
					           	user_data.step = 4;
								break;
						default:
							sendMessageToUser({
					            type: "text/plain",
					            content: "Desculpe. OPcorreu um erro.",
					            to: message.from					            
				  	        });	 			    
				  	        user_data.step = 2;    
	 					}

					}else{
						console.log("Nope");
						sendMessageToUser({
				            type: "text/plain",
				            content: "O Nome e o CPF não batem. Favor digitar o nome novamente.",
				            to: message.from
			  	        });	       
			  	        user_data.step = 1;     		        
					}	
	 			}				
					
	 		});						  
	}
}

	function stepAnalysis(message) {
		switch (message.content) {	    
			case "Receber Notificações":
				var text = "Beleza. Eu posso te enviar uma mensagem 3 dias antes de sua fatura vencer. Tudo bem?";
				var messageToSend = buildMessage(message.from,text,["Sim","Não"]);	     			
				sendMessageToUser(messageToSend);
	           	user_data.step = 5;
				break;

			case "Próxima Fatura":
				var text = "Nós podemos te enviar o boleto da sua próxima fatura via email e SMS. Como gostaria de recebê-lo?";
				var messageToSend = buildMessage(message.from,text,["Email","SMS","Cancelar"]);	     			
				sendMessageToUser(messageToSend);
	           	user_data.step = 6;
				break;
			case "Encerrar Conversa":
				sendMessageToUser({
			            type: "text/plain",
			            content: "Ok! Qualquer coisa, estou aqui. Até mais! =)",
			            to: message.from
		  	        });	 
	           	user_data.step = 1;
				break;
			default:
				sendMessageToUser({
		            type: "text/plain",
		            content: "Desculpe. Não entendi.",
		            to: message.from
	  	        });	 
		}
	}

	function stepNotificationConfirmation(message) {
		switch (message.content) {	 
			case "Sim":
				var text = "Ótimo! Acabei de ativar o serviço de recebimento de notificações. Algo mais que posso ajudar?";
				var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     	    			
				sendMessageToUser(messageToSend);
	           	user_data.step = 3;
				break;
			case "Não":
				var text = "Que pena =(. Em que mais posso te ajudar?";
				var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     			
				sendMessageToUser(messageToSend);
	           	user_data.step = 3;
				break;
			default:
				sendMessageToUser({
		            type: "text/plain",
		            content: "Desculpe. Não entendi.",
		            to: message.from
	  	        });	
		}
	}


	function stepPayment(message) {
		switch (message.content) {			
				case "Email":
					var text = "Ótimo! Você irá receber a próxima fatura via email em até 24 horas. Em que mais posso te ajudar?";
					var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     	    			
					sendMessageToUser(messageToSend);
		           	user_data.step = 3;
					break;
			
				case "SMS":
					var text = "Ótimo! Você irá receber a próxima fatura via SMS em até 24 horas. Em que mais posso te ajudar?";
					var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     			
					sendMessageToUser(messageToSend);
		           	user_data.step = 3;
					break;

				default:
				sendMessageToUser({
		            type: "text/plain",
		            content: "Desculpe. Não entendi.",
		            to: message.from
	  	        });	
	  	        break;
		}		
	}


	function stepProposal(message) {
		switch (message.content) {	 
			case "Sim":
				sendMessageToUser({
		            type: "text/plain",
		            content: "Legal! O que acha destas propostas?",
		            to: message.from
	  	        });	
	  	        sendMessageToUser(buildProposals(message));
	           	user_data.step = 7;
				break;
			case "Não":
					var text = "Que pena =(. Em que mais posso te ajudar?";
					var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     			
					sendMessageToUser(messageToSend);
		           	user_data.step = 3;
					break;
				break;
			default:
				sendMessageToUser({
		            type: "text/plain",
		            content: "Desculpe. Não entendi.",
		            to: message.from
	  	        });	
		}
	}



	function stepHandleProposals(message) {
		switch (message.content) {	 
			case "Proposta 1":
				if(user_data == 'B'){
					var text = "Ótimo, então daremos à você um "+user_proposal[0]+". Está correto?";
					var messageToSend = buildMessage(message.from,text,["Sim","Não"]);     			
					sendMessageToUser(messageToSend);
		           	user_data.step = 8;
					break;
				}else{
					var text = "Ótimo, então daremos à você um um "+user_proposal[0]+". Está correto?";
					var messageToSend = buildMessage(message.from,text,["Sim","Não"]);     			
					sendMessageToUser(messageToSend);
		           	user_data.step = 8;
					break;
				}
				break;
			case "Proposta 2":
					var text = "Ótimo, agora suas faturas estão assim:\n "+user_proposal[1]+"\nEstá correto?";
					var messageToSend = buildMessage(message.from,text,["Sim","Não"]);     			
					sendMessageToUser(messageToSend);
		           	user_data.step = 8;
					break;
			default:
				sendMessageToUser({
		            type: "text/plain",
		            content: "Desculpe. Não entendi.",
		            to: message.from
	  	        });	
		}
	}


	function stepFinishProposal(message) {
		switch (message.content) {	 
			case "Sim":
				var text = "Ótimo! Sua conta foi alterada. Algo mais que posso ajudar?";
				var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     	    			
				sendMessageToUser(messageToSend);
	           	user_data.step = 3;
				break;
			case "Não":
				var text = "Que pena =(. Em que mais posso te ajudar?";
				var messageToSend = buildMessage(message.from,text,["Receber Notificações","Próxima Fatura", "Encerrar Conversa"]);     			
				sendMessageToUser(messageToSend);
	           	user_data.step = 3;
				break;
			default:
				sendMessageToUser({
		            type: "text/plain",
		            content: "Desculpe. Não entendi.",
		            to: message.from
	  	        });	
		}
		}
	

	//run server
	app.listen(app.get('port'), function() {
	    console.log('running on port', app.get('port'))
	//    getClientes();
	 //   getByCPF("106.303.836-77");
	})
});