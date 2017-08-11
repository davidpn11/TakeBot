var user_data = {
	"cpf": "111.111.111-11",
	"nome": "Junqueira Jr.",
	"categoria": "A",
	"valor_total": 30000,
	"parcelas_restantes": 30,
	"parcelas_atrasadas": 3.0
};


var taxa = 1.0265287;


function calculateProposal1() {
		var juros = Math.pow(taxa,user_data.parcelas_atrasadas);
		var desconto = user_data.valor_total*juros - user_data.valor_total;

		return "Para te ajudar eu posso te dar um desconto de R$"+ desconto.toFixed(2)+". Que tal?";
	}

		function calculateProposal2() {
		var juros = Math.pow(taxa,user_data.parcelas_atrasadas);
		var novo_valor = user_data.valor_total*juros;		
		user_data.valor_total = novo_valor;		
		var valor_parcela = user_data.valor_total/user_data.parcelas_restantes;	
		var dif_parcelas = 60 - user_data.parcelas_restantes;
		var nova_parcela = novo_valor/60;
		var dif_valor_parcela = valor_parcela - nova_parcela;

		return "A gente diminui a parcela em R$"+dif_valor_parcela.toFixed(2)+" e estendemos o prazo por mais "+dif_parcelas+" meses, a partir de hoje ("+nova_parcela.toFixed(2)+" x 60 meses). Que tal?";
	}



//var juros = Math.pow(taxa,user_data.parcelas_atrasadas);//parseFloat(taxa^user_data.parcelas_atrasadas).toFixed(3);
//var x = calculateProposal1;
console.log(calculateProposal2());
