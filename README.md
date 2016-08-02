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

