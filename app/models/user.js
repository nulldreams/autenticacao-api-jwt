// Vamos adicionar nosso pacote do mongoose 
var mongoose 	  = require('mongoose')
// e criar um objeto com schema do nosso usuário que será salvo no banco.
var usuarioSchema = new mongoose.Schema({
		name     : String,
		password : String
})

// Agora aqui vamos devolver o Schema do usuário para quer acessar este arquivo
module.exports = mongoose.model('Usuario', usuarioSchema)