# Smsflash

Smsflash is startup news aggregator. it allows you to create your own news aggregator
and share it with your friends and family. it also allows you to create your own news
Website: [www.smsflash.in](Smsflash)

# Server

Server is based on QueryLanguage in this case we opted Graphql as our queryLanguage. every
thing in server is built as one single standalone module. Which is easy to manage in future as server
grows.

**1. Server Artitecture**

###### A. Context

Context is plain object shared across all methods inside `~routes/` folder. In our server
Context is created inside `~www/` folder. all methods inside `~Context` folder are imported
as regular module and are initiated. Once server get hit context is passed down to all methods
handling given hit.

###### B. dyna_modules

Dyna Modules are dynamic modules these modules don't have any external dependency or any complex
dependency system you can load them as regular module just like you do with npm. if you wan't to use
any module in dyna_modules than you have to import them individually example:
`import ModuleName from 'dyna_modules/modulePath'`

###### C. Prisma

Prisma is database handler. it allows dynamic database field creation and manipulation apart from
database syntax and workflow as it provide standardize syntax which is javascript object for all databases available.
for more visit [Prisma.io](Prisma)

###### D. Routes

Routes folder is where businessLogic are bundled as individual modules. Each module contains following
directories. each file and folder listed below are optional to module creation.it all depends on
need.<br/>

`1. __mutation__`<br/>

contains all mutation's as individual modules. these mutations are mapped to `index.graphql`
in Parent folder as system follows Hierarchical independent modules system.

`2. __resolver__`<br/>

contains all resolver as individual modules. these resolvers are mapped to `index.graphql`
in Parent folder as system follows Hierarchical independent modules system.

`3. __subscription__`<br/>

contains all subscription as individual modules. these subscription are mapped to `index.graphql`
in Parent folder as system follows Hierarchical independent modules system.

`4. __index__.py`<br/>

Entry file to module this file imports all mutation, resolver and subscription exports along side all
graphql file as one single module.

`5. index.graphql`<br/>
contains language definition for all mutation, resolver and subscription exported method's.

`6. *.enum.graphql`

contains enum definition for query language. these enum files are created so that you can
easily pick on enum values and have better understanding of system

`7. *.directives.graphql`

contains directive definition every directive in graphql needs definition before you use it
anywhere. so this file where you can define directive in query language.

`8. index.prisma`
Prisma files are database schemas which Prisma constructor use to generate database query and
handlers automatically for you.

**2. Server Installation**

Server Provides two-way of installation. one is docker and other is a classic way
module handling in python you can choose conda or 3rdPart based envs on your choice.

**Docker :** `docker-compose build && docker-compose up`<br/>
**Classical :**
`pip install -r ./requirements`

**2. Server Running**
After successful installation you can run `uvicorn --host 0.0.0.0 --port 5555 "packages:App" --reload` if you want to run locally or `docker run -p 5555:5555 -it packages:App`
if you want to run it production mode.

Once server successfully boots up you can visit following url's.

[1. Server](http:://localhost:5555/)<br/>
[2. Playground](http:://localhost:3000/play)<br/>
[3. Subscription](http:://localhost:3000/subscription)<br/>
[4. Database Admin](http:://localhost:4466/_admin)<br/>
