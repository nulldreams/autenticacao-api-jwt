// Vamos referenciar os pacotes que precisamos
var express 	   = require('express')
var app 		   = express()
var bodyParser     = require('body-parser')
var morgan		   = require('morgan')
var mongoose       = require('mongoose')

//
var jwt 		   = require('jsonwebtoken')
var config 		   = require('./config')
var User 		   = require('./app/models/user')

//
var port 		   = process.env.PORT || 3000
mongoose.Promise   = global.Promise;
mongoose.connect(config.url)     // Conectamos no banco
app.set('superSecret', config.secret) // Variável secret

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Logs das requisições
app.use(morgan('dev'))

// Rotas ===========
// rota basica

app.get('/', (req, res) => {
	res.send('Olá, a API está em http://localhost:' + port + '/api')
})

app.post('/cadastrar', (req, res) => {
    // Criamos um novo usuário utilizando o schema que montamos na pasta models
	var novoUsuario = new User({
		name	: req.body.name,   // A instrução req.body nos retorna um objeto com os dados que foram enviados através de uma requisição
		password: req.body.password
	})

	novoUsuario.save((err) => {
		if (err) throw err // Se tiver algum erro na hora de salvar, usamos o throw para retornar uma "exception"

		console.log('Usuário cadastrado com sucesso')
		res.json({ success: true }) // Se tudo ocorrer bem, retornamos um json dizendo que deu certo
	})
})

// Rotas da API
// Utiliza uma instancia do Router para as rotas da API
var apiRoutes = express.Router() 

// Rota de autenticacao de usuário (POST /api/authenticate)

apiRoutes.post('/authenticate', (req, res) => {
console.log(req.body)
	User.findOne({ name: req.body.name }, (err, user) => { // O findOne é como um Select, passando um filtro que é o 'name'
		if (err) throw err

		// Verificamos se o usuário existe
		if(!user) res.json({ success: false, message: 'A autenticação falhou, o usuário não foi encontrado :C'})
		// Verificamos se a senha é correta
		if(user.password != req.body.password) res.json({ success: false, message: 'A autenticação falhou, a senha está incorreta :C'})
		else {
			// Se não tiver nenhum erro, então criamos o Token para ele
			var token = jwt.sign(user, app.get('superSecret'), { expiresIn: '1440m' }) // Aqui dizemos que o Token expira em 1440 minutos (24 hrs)

			// Retornamos um json dizendo que deu certo junto com o seu Token
			res.json({ success: true, message: 'Aproveite seu token!', token: token})
		}
	})
})

// middleware para validar o Token
apiRoutes.use( (req, res, next) => {
    
    // Aqui vamos verificar o header da requisição, os parametros e o corpo da requisição, procurando o token
	var token = req.body.token || req.query.token || req.headers['x-access-token']

	// Se o token existir
	if (token) {

		// Verificamos se o token está batendo com a nossa Secret
		jwt.verify(token, app.get('superSecret'), (err, decoded) => {
			if (err) return res.json({ success: false, message: 'A autenticação com o token falhou.' })
			else {
				// Se o token estiver válido, então salvamos ele e liberamos o acesso, fazemos o trabalho do porteiro de um prédio aqui.
				req.decoded = decoded
				next()
			}
		})
	} else {
		// Se quem requisitou não informou o token, devolvemos um erro para ele.
		return res.status(403).send({ success: false, message: 'Nenhum token foi informado.'})
	}
})

// Rota para nos devolver uma mensagem aleatória (GET /api)
apiRoutes.get('/', (req, res) => {
	res.json({ message: 'Bem vindo a API mais dahora no mundo!' })
})

// Rota que retorna todos os usuários cadastrados no banco (GET /api/users)
apiRoutes.get('/users', (req, res) => {
	User.find({}, (err, users) => { // O que fizemos aqui foi basicamente um Select na "tabela" de usuários
		res.json(users)
	})
})

// Aqui dizemos que as rotas terão o prefixo /api
app.use('/api', apiRoutes)

// Inicia o servidor
app.listen(port)
console.log('Servidor iniciado em http://localhost:' + port)