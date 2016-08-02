##Dependencias
- Mongodb - se necesita una base de datos mongo.
- unrtf -  Se utiliza para transformar rft a html y luego parsear el html.
- nodejs


##Instalacion
###Instalar unrtf en distribuciones basadas en Debian.
````
sudo apt-get install unrtf
```

### Instalar PaScraper
##### Clonar el repositorio
```
git clone https://github.com/demianfe/PaScraper.git
```
#### Instalar las dependencias con npm.
```
cd PaScraper/
npm install
```
#### Configurar el Proyecto
##### Copiar y editar el archivo de configuración
```
cp src/scraper/config-example.js src/scraper/config.js
```
Editar el archivo `src/scraper/config.js` con los valores apropiados.

#### Compilar el proyecto.
```
npm run build
```
#### Correr el Proyecto
Sin parametros imprime el mesaje de ayuda:
```
npm start 
```

Deberia mostrar lo siguiente:
```
Usage: 
npm start -- <command>

Possible commands are:
crawl-sessions   args: year, the year to crawl.
download-rtfs    downlad rtf. Args: year, download files from that year.
parse-rtfs               parses all dowonloaded rtfs and saves to monto db.
map-votaciones   maps diputados and voting results to votacionespa.
get-congressmen          downloads congressmen data.
download-bills   Download all bills related to all congressmen 
                         within this parlamentary period.
download-bills-files     Download files related to bills. 
                         download-bills should be executed before.
map-bills                maps all bills to bill-it.
update-bills             updates bills with status "EN TRAMITE"
```

