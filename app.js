const express = require("express"); //importou a classe
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser"); //importa o body-parser
const session = require("express-session");
const { error } = require("console");

const port = 9000; // porta TCP do servidor HTTP da aplicação

const app = express(); //Instância para o uso do Express

// Cria conexão com o banco de dados
const db = new sqlite3.Database("user.db"); //Instâcia para uso do Sqlite3, e usa o arquivo 'user.db'

let config = { titulo: "", rodape: "" };

db.serialize(() => {
  // Este metodo permite enviar comandos SQL em modo 'sequencial'
  db.run(
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT, celular TEXT, cpf TEXT, rg TEXT)`
  );
});

app.use(
  session({
    secret: "qualquersenha",
    resave: true,
    saveUninitialized: true,
  })
);

// __dirname é a variavel interna do nodejs que guarda o caminho absolute do projeto, no SO
// console.log(__dirname + "/static");

// Aqui será acrescentado uma rota "/static" para a pasta __dirname + "/static"
// O app.use é usado para acrescentar rotas novas para o Express gerenciar e pode usar
// Middleware para isto, que neste caso é o express.static que gerencia rotas estaticas
app.use("/static", express.static(__dirname + "/static"));

// MIddleware para processar as requisições do Body Parameters do cliente
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar EJS como o motor de visualização
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  // Passe a variável 'req' para o template e use-a nas páginas para renderizar partes do HTML conforme determinada condição
  // Por exemplo de o usuário estive logado, veja este exemplo no arquivo views/partials/header.ejs
  res.render("pages/index", { ...config, req: req });
  // Caso haja necessidade coloque pontos de verificação para verificar pontos da sua logica de negócios
  console.log(
    `${
      req.session.username
        ? `User ${req.session.username} logged in from IP ${req.connection.remoteAddress}`
        : "User not logged in."
    }  `
  );
});

const Home =
  "<a href='/sobre'> Sobre </a><a href='/Login'> Login </a><a href='/cadastro'> Cadastro </a>";
const Sobre = 'vc está na página "Sobre"<br><a href="/">Voltar</a>';
const Login = 'vc está na página "Login"<br><a href="/">Voltar</a>';
const cadastro = 'vc está na página "Cadastro"<br><a href="/">Voltar</a>';

// Metodo express. get necessita de dois parâmetros
//Na ARROW FUNCTION, O primeiro são dados do servidor (REQUISITION - 'req')
// o segundo sao os dados que serao enviados ao cliente (result - 'res')
app.get("/", (req, res) => {
  // res.send(Home);
  console.log("GET /index");
  // res.render("pages/index", {
  //   titulo: "Blog da turma I2HNA - SESI Nova Odessa",
  // });
  // res.redirect("/cadastro"); // Redireciona para a ROTA cadastro
  config = { titulo: "Blog da turma I2HNA - Sesi Nova Odessa", rodape: "" };
  res.render("pages/index", { ...config, req: req });
});

app.get("/sobre", (req, res) => {
  console.log("GET /sobre");
  res.render("pages/sobre", { ...config, req: req });
});

app.get("/login", (req, res) => {
  console.log("GET /login");
  res.render("pages/login", { ...config, req: req });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.get(query, [username, password, email], (err, row) => {
    if (err) throw err;

    if (row) {
      // Utilize req.session às variáveis de sessão para controlar a lógica de sua página em função da sessão, como
      // por exemplo se o usuário está autenticado (logado).
      req.session.loggedin = true;
      req.session.username = username; // Crie variáveis de controle adicionais caso haja ncessidade
      req.session.email = email;
      // req.session.dataLogin = new Date() // Exemplo de criação de variável de sessão para controlar o tempo de login.
      res.redirect("/dashboard");
    } else {
      res.render("/login_failed", { ...config, req: req });
    }
  });
});

// app.get("/dashboard", (req, res) => {
//   console.log("GET /dashboard");

//   if (req.session.loggedin) {
//     const query = "SELECT * FROM users";

//     db.all(query, (err, rows) => {
//       if (err) throw err;
//       //if (row) {
//       console.log(rows);
//       res.render("pages/dashboard", { ...config, row: rows, req: req });
//       //}
//     });
//   } else {
//     res.render("pages/login_failed", { ...config, req: req });
//   }
// });

app.get("/cadastro", (req, res) => {
  console.log("GET /cadastro");
  res.render("pages/cadastro", { ...config, req: req });
});

app.get("/usuarios", (req, res) => {
  const query = "SELECT * FROM users";
  db.all(query, (err, row) => {
    console.log(`GET /usuarios ${JSON.stringify(row)}`);
    res.render("pages/usertable");
  });
});

app.get("/dashboard", (req, res) => {
  console.log ("GET /dashboard");
  console.log (JSON.stringify(config));

  if (req.session.loggedin) {
    db.all("SELECT * FROM users", [], (err, row) => {
      if (err) throw err;
      res.render("pages/dashboard", {
        titulo: "DASHBOARD",
        dados: row,
        req: req,      
      });
    });
  } else {
    console.log("Tentativa de acess à área restrita");
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  // Exemplo de uma rota (END POINT) controlado pela sessão do usuário logado.
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/invalido", (req,res) =>{
  res.render("pages/error", { ...config, req: req, error: "usuario ja cadastrado,refaça" });
})

app.get("/valido", (req,res) =>{

  res.render("pages/error", { ...config, req: req, error: "usuario cadastrado com sucesso" });
})





app.post("/cadastro", (req, res) => {
  console.log("POST /cadastro");
  !req.body
    ? console.log(`Body vazio: ${req.body}`)
    : console.log(JSON.stringify(req.body));

  const { username, password, email, celular, cpf, rg } = req.body;
  // Colocar aqui validações e inclusão no banco de dados do cadastro do usuário
  // 1. Validar dados do usuário

  // 2. Saber se ele já existe no banco
  const query =
    "SELECT * FROM users WHERE email=? OR cpf=? OR rg=? OR username=?";
  db.get(query, [email, cpf, rg, username], (err, row) => {
    if (err) throw err;
    console.log(`${JSON.stringify(row)}`);
    if (row) {
      // A variavel 'row' irá retornar os dados do banco de dados,
      // executado atraves do SQL, variavel query
      res.redirect("/invalido");
    } else {
      // 3. Se o usuário não existe no banco cadastrar
      const insertQuery =
        "INSERT INTO users (username, password, email, celular, cpf, rg) VALUES (?,?,?,?,?,?)";
      db.run(
        insertQuery,
        [username, password, email, celular, cpf, rg],
        (err) => {
          // inserir a lógica do INSERT
          if (err) throw err;
          res.redirect("/valido");
        }
      );
    }
  });
});

app.use("*", (req, res) => {
  // Envia uma resposta de erro 404
  res.status(404).render("pages/404", { ...config, req: req });
});

//app.listen() deve ser o último comando da aplicação (app.js)
app.listen(port, () => {
  console.log(`Servidor sendo executado na porta ${port}!`);
});
