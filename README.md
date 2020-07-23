# Doctor's Clinic - back-end

Projeto desenvolvido para portfólio. REST API feita em Node.js utilizando o framework [Adonis JS](https://adonisjs.com/) para uma aplicação de clinica médica controlando médicos, pacientes, assistentes e administradores e todo o fluxo de consultas.

O projeto conta com autenticação e autorização com uso de papéis e permissões através do provider customizado [Adonis ACL](https://github.com/enniel/adonis-acl).

Caso queira dar uma olhada no MER do sistema para ter uma idéia geral das entidades controladas, acesse neste [link](https://dbdiagram.io/d/5e93bbf939d18f5553fd7ccb).

## Índice

- [Tecnologias e libs utilizadas](#-tecnologias-e-libs-utilizadas)
- [Requisitos iniciais](#-requisitos-iniciais)
- [Instalação](#-instalação)
- [Configurações](#-configurações)
- [Testes](#-testes)

## Tecnologias e libs utilizadas

Abaixo seguem as tecnologias utilizadas no desenvolvimento do projeto:

- [Node.js](https://nodejs.org/en/download/)
- [Adonis JS](https://adonisjs.com/)
- [Adonis ACL](https://github.com/enniel/adonis-acl)
- [Lucid ORM](https://github.com/adonisjs/lucid)
- [Postgres](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [date-fns](https://date-fns.org/)
- [Istanbul](https://istanbul.js.org/)

## Requisitos iniciais

Para poder rodar o projeto, é necessário que os itens abaixo estejam instalados:

- [Node.js](https://nodejs.org/en/download/)
- [Adonis JS](https://adonisjs.com/)
- [npm](https://www.npmjs.com/get-npm) ou [yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
- [PostgreSQL](https://www.postgresql.org/download/)
- [git](https://git-scm.com/downloads)

### Opcionais

- [Postbird](https://www.electronjs.org/apps/postbird) (ou outro cliente para acesso ao banco de dados)
- [Insomnia](https://insomnia.rest/download/) (ou outro cliente REST para acesso às rotas da API)

## Instalação

Para instalar o projeto localmente na sua máquina, clonar o repositório com o comando abaixo:

```bash
$ git clone https://github.com/gpmarchi/doctors-clinic-backend.git && cd doctors-clinic-backend
```

Rodar o comando abaixo para instalar as dependências:

```bash
$ npm install
```

## Configurações

Será necessário configurar as variáveis de ambiente necessárias para rodar o projeto. Para isso criar um arquivo chamado `.env` na raiz do projeto (utilizar como exemplo o arquivo `.env.example` também presente na raiz do projeto).

As informações que deverão ser preenchidas (para gerar a APP_KEY, utilizar o comando `adonis key:generate`):

```env
HOST=127.0.0.1
PORT=3333
NODE_ENV=development
APP_NAME=Doctors Clinic
APP_URL=http://${HOST}:${PORT}
FORGOT_PASSWORD_URL=
CONSULTATION_CONFIRMATION_URL=
CACHE_VIEWS=false
APP_KEY=<chave gerada automaticamente para uso do bcrypt>

TZ=UTC

DB_CONNECTION=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=<usuário do banco de dados>
DB_PASSWORD=<senha do usuário do banco de dados>
DB_DATABASE=doctors-clinic

MAIL_HOST=<endereço do servidor smtp para envio de e-mails>
MAIL_PORT=<porta do servidor de e-mails>
MAIL_USERNAME=<usuário no servidor de e-mails>
MAIL_PASSWORD=<senha do usuário no servidor de e-mails>

SESSION_DRIVER=cookie
HASH_DRIVER=bcrypt
```

É importante frisar que a base de dados deve ser criada com o mesmo nome preenchido na variável `DB_DATABASE`.

O projeto foi todo desenvolvido utilizando a técnica de TDD (Test Driven Development) e possui uma boa cobertura de testes. Para rodá-los é necessário criar um arquivo separado de variáveis de ambiente (`.env.testing`) também na raiz do projeto, apenas com as que devem ser modificadas para serem utilizadas nesse ambiente:

```env
PORT=4000
NODE_ENV=testing

DB_DATABASE=doctors-clinic-test

MAIL_PORT=<porta do servidor de e-mails de testes>
MAIL_HOST=<endereço do servidor smtp de testes para envio de e-mails>
MAIL_USERNAME=<usuário no servidor de e-mails de testes>
MAIL_PASSWORD=<senha do usuário no servidor de e-mails de testes>
```

### Rodando migrations e seeds

Para criar as tabelas necessárias ao funcionamento da aplicação, utilizaremos os comandos ace fornecidos pelo Adonis para rodar as migrtions e seeds necessários. A criação das tabelas e relacionamentos será feita através do comando:

```bash
$ adonis migration:run
```

E para criar as informações necessárias para rodar o sistema pela primera vez (com o usuário adminstrador e conteúdo das tabelas de cadastros básicos) rodar os seeds com o comando:

```bash
$ adonis seed
```

## Rodando o projeto

A partir desse momento o ambiente já está preparado para rodarmos a API. Para iniciar o servidor com live reload em modo de desenvolvimento rodar o comando:

```bash
$ adonis serve --dev
```

Também será necessário iniciar um processo paralelo ao servidor que fará o processamento das filas de envio de e-mails de notificações, cancelamentos e reset de senha :

```bash
$ adonis kue:listen
```

## Testando as funcionalidades

As funcionalidades da aplicação poderão ser testadas através do workspace do Insomnia, cliente REST escolhido como apoio para o desenvolvimento da API .

Através do botão abaixo é possível importar esse workspace em sua máquina caso já tenha o Insomnia instalado. Basta clicar no botão e seguir os passos para finalizar a importação.

[![Run in Insomnia}](https://insomnia.rest/images/run.svg)](https://insomnia.rest/run/?label=)

Para testar será necessário logar na API com o usuário padrão de testes utilizando a rota `Create` na pasta `Sessions`:

```json
{
  "email": "admin@doctorsclinic.com",
  "password": "123456"
}
```

Após feito o login será possível acessar qualquer rota protegida para fazer os cadastros e testar as demais funcionalidades da API.

## Testes

Como já mencionado toda a aplicação foi construída utilizando TDD, portanto os testes podem ser encontrados na pasta `/test`. Para rodá-los utilizar o comando:

```bash
$ adonis test
```

Para gerar o relatório de cobertura dos testes utilizei a lib [Istanbul](https://istanbul.js.org/). Para rodar os testes gerando o relatório, utilizar o comando:

```bash
$ npx nyc adonis test -b
```

Após rodar os testes, acessar o arquivo `/coverage/lcov-report/index.html` para visualizar o relatório gerado.
