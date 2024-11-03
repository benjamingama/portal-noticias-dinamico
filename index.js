const express = require("express");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dotenv = require("dotenv");
var dotenvExpand = require("dotenv-expand");

var result = dotenv.config();
dotenvExpand.expand(result);

console.log(result.parsed);
const path = require("path");

const app = express();
const Posts = require("./posts.js");

mongoose
  .connect(
    process.env.MONGODB_URL,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(function () {
    console.log("Conectado com sucesso");
  })
  .catch(function (err) {
    console.log(err.message);
  });

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/public", express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/pages"));

app.get("/", (req, res) => {
  if (req.query.busca == null) {
    Posts.find({})
      .sort({ _id: -1 })
      .exec(function (err, posts) {
        // console.log(posts[0]);
        posts = posts.map(function (val) {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
          };
        });

        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec(function (err, postsTop) {
            // console.log(posts[0]);
            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });

            res.render("home", { posts: posts, postsTop: postsTop });
          });
      });
  } else {
    Posts.find(
      { titulo: { $regex: req.query.busca, $options: "i" } },
      function (err, posts) {
        console.log(posts);
        posts = posts.map(function (val) {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
            views: val.views,
          };
        });
        res.render("busca", { posts: posts, contagem: posts.length });
      }
    );
  }
});

app.get("/:slug", (req, res) => {
  //res.send(req.params.slug);
  Posts.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true },
    function (err, resposta) {
      // console.log(resposta);
      if (resposta != null) {
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec(function (err, postsTop) {
            // console.log(posts[0]);
            postsTop = postsTop.map(function (val) {
              console.log(val)
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });

            res.render("single", { noticia: resposta, postsTop: postsTop });
          });
      } else {
        res.redirect("/");
      }
    }
  );
});

app.listen(3000, () => {
  console.log("server rodando!");
});
