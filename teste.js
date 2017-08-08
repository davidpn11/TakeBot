function buildMessage(messageText,messageOptions){

    var options = [];

    for(var i =0 ; i < messageOptions.length;i++){
        var obj = {"text":messageOptions[i]};
        options.push(obj);
    }

    var message = {
                "id": "311F87C0-F938-4FF3-991A-7C5AEF7771A5",
                "to": "ok",
                "type": "application/vnd.lime.select+json",
                "content": {
                    "text": messageText,
                    "options": options,
                }
            };

    console.log(JSON.stringify(message));	
}

buildMessage("teste",["david","pena"])



