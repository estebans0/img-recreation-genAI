/* Autores:
    - Brandon Calderon Cubero
    - Esteban Solano Araya
    - Gerardo Gomez Brenes
    - Pamela Fernandez Mora
*/

// --------------------------------------------------- FUNCIONES ---------------------------------------------------
function distanciaEuclideana(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
}

function obtenerPuntosValidos(img, tamanoImg) {
    let pixeles = [];
    for (x = 0; x < tamanoImg; x++) {
        for (y = 0; y < tamanoImg; y++) {
            let color = img.ucharPtr(y,x);
            if (color[0] != 255 && color[1] != 255 && color[2] != 255) {
                pixeles.push([x, y]);
            }
        }
    }
    return pixeles;
}

// Función que dados 2 puntos con direcciones X e Y, calcula todos los puntos intermedios entre ellos
// Se basa en el algoritmo de Bresenham para dibujar lineas: https://www.javatpoint.com/computer-graphics-bresenhams-line-algorithm
function puntosIntermedios(p1, p2) {
    let lstPuntos = [];
    let x1 = p1.x;
    let y1 = p1.y;
    let x2 = p2.x;
    let y2 = p2.y;
    // Diferencia absoluta en X y Y. Estas diferencias representan las longitudes de la recta en las direcciones X e Y
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    // Determina la dirección de la recta. Si x1 es menor que x2, sx se establece en 1, de lo contrario se establece en -1.Lo mismo para sy
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    // Error es la cantidad de veces que la recta se desvía de la ubicación ideal. Se inicializa en 0
    let err = dx - dy;
    while (true) {
        lstPuntos.push([x1, y1]);
        if ((x1 == x2) && (y1 == y2)) break;
        // e2 es el error de dos veces. Si es mayor que -dy, la recta se desvía menos en la dirección y (x1, y1 + 1); de lo contrario, la recta se desvía más en la dirección y (x1 + 1, y1 + 1)
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 < dx) { err += dx; y1 += sy; }
    }
    return lstPuntos;
}

function agregarIntermedios(actual, nuevo) {
    // Convertir el array actual a un set para poder comparar
    let setActual = new Set(actual.map(point => point.join(',')));
    // Filtrar los nuevos elementos que no estén en el set actual
    let nuevosElementos = nuevo.filter(point => !setActual.has(point.join(',')));
    // Concatenar los arrays
    let combinacion = actual.concat(nuevosElementos);
    return combinacion;
}

function compararPuntos(puntosValidos, puntosInd) {
    // Set de puntosValidos
    let setValidos = new Set(puntosValidos.map(point => point.join(',')));
    // Filtrar puntosValidos que estén en puntosInd
    let puntosComunes = puntosInd.filter(point => setValidos.has(point.join(',')));
    return puntosComunes;
}

class Individuo {
    constructor(img, cromosoma=null) {
        if (cromosoma == null) {
            this.cromosoma = this.generarCromosoma(img);
        } else {
            this.cromosoma = cromosoma;
        }
        this.linea = this.cromosoma[0];
        this.anchoLinea = this.cromosoma[1];
        this.fitness = null;
    }

    generarCromosoma(img) {
        let puntos = []
        let tamImg = img.rows;
        let tamLinea = Math.floor(Math.random() * tamImg) + 5;
        for (let i=0; i < tamLinea; i++) {
           let x = Math.floor(Math.random() * tamImg);
           let y = Math.floor(Math.random() * tamImg);
           puntos.push(new cv.Point(x, y));
        }
        let anchoLinea = 2; //Math.floor(Math.random() * 5) + 1;
        return [puntos, anchoLinea];
    }

    calificarFitness(distancias) {
        let fitness = 0;
        for (let distancia of distancias) {
            // if (distancia == 0) {
            //     fitness += 20;
            // } else if (distancia == 1) {
            //     fitness += 10;
            // } else if (distancia == 2) {
            //     fitness += 5;
            // } else if (distancia < 5) {
            //     fitness += 3;
            // } else if (distancia < 10) {
            //     fitness += 1;
            // } else if (distancia < 20) {
            //     fitness -= 20;
            // } else if (distancia < 25) {
            //     fitness -= 30;
            // } else if (distancia < 30) {
            //     fitness -= 50;
            // } else if (distancia < 40) {
            //     fitness -= 70;
            // } else if (distancia < 50) {
            //     fitness -= 80;
            // } else {
            //     fitness -= 100;
            // }
            if (distancia == 0) {
                fitness += 100;
            } else if (distancia == 1) {
                fitness += 50;
            } else if (distancia == 2) {
                fitness += 20;
            } else if (distancia < 5) {
                fitness += 5;
            } else if (distancia < 10) {
                fitness -= 10;
            } else if (distancia < 20) {
                fitness -= 30;
            } else if (distancia < 25) {
                fitness -= 40;
            } else if (distancia < 30) {
                fitness -= 60;
            } else if (distancia < 40) {
                fitness -= 100;
            } else if (distancia < 50) {
                fitness -= 150;
            } else {
                fitness -= 200;
            }
        }
        return fitness;
    }
    
    calcularFitness(puntosValidos, tamanoImg) {
        let lstPuntos = this.linea;
        let distanciaPermitida = tamanoImg / (lstPuntos.length*0.6);
        let fitness = 0;
        let ptsIntermedios = [];
        for (let i = 0; i < lstPuntos.length-1; i++) {
            let p1 = lstPuntos[i];
            let p2 = lstPuntos[i+1];
            for (let j = 0; j < lstPuntos.length-1; j++) {
                if (distanciaEuclideana(p1.x, p1.y, lstPuntos[j].x, lstPuntos[j].y) < distanciaPermitida) {
                    fitness -= 100;
                }
            }
            let intermedios = puntosIntermedios(p1, p2);
            ptsIntermedios = agregarIntermedios(ptsIntermedios, intermedios);
            let distancias = [];
            for (let puntoInt of intermedios) {
                let minDistancia = Infinity;
                for (let puntoVal of puntosValidos) {
                    let distancia = distanciaEuclideana(puntoVal[0], puntoVal[1], puntoInt[0], puntoInt[1]);
                    minDistancia = Math.min(minDistancia, distancia);
                }
                distancias.push(minDistancia);
            }
            fitness += this.calificarFitness(distancias);
        }
        fitness += (puntosValidos.length - compararPuntos(puntosValidos, ptsIntermedios).length);
        this.fitness = fitness;
        return fitness;
    }

    cruzar(otro, img, puntosValidos) {
        let hijo = [];
        for (let i = 0; i < this.linea.length; i++) {
            if (Math.random() < 0.5) { // 50% de probabilidad de que el punto sea del padre o de la madre
                if (i < otro.linea.length) {
                    hijo.push(otro.linea[i]);
                }
            } else {
                hijo.push(this.linea[i]);
            }
        }
        let nuevoIndividuo = new Individuo(img, [hijo, this.anchoLinea]);
        return nuevoIndividuo;
    }

    mutar(img, puntosValidos) {
        let tamImg = img.rows;
        // Mutaciones de largo
        for (let i = 0; i < this.linea.length; i++) {
            if (Math.random() < 0.15) {
                let x = Math.floor(Math.random() * tamImg);
                let y = Math.floor(Math.random() * tamImg);
                let nuevoPunto = new cv.Point(x, y);
                this.linea[i] = nuevoPunto;
            }
        }
        this.cromosoma = [this.linea, this.anchoLinea];
        return this;
    }

    dibujarIndividuo(canvas) {
        let puntos = this.linea;
        for (let i = 0; i < puntos.length-1; i++) {
           let p1 = puntos[i];
           let p2 = puntos[i+1];
           cv.line(canvas, p1, p2, [255, 255, 255, 255], this.anchoLinea);
        }
    }
}

class Poblacion {
    constructor(img, canvas, tamPoblacion, puntosValidos, numGen = null, poblacion = null) {
        this.mejor_fitness = null;
        this.fitness_promedio = null;
        this.mejor_individuo = null;
        if (poblacion == null) {
            this.poblacion = [];
            for (let i = 0; i < tamPoblacion; i++) {
                this.poblacion.push(new Individuo(img));
            }
            this.numGen = 0;
        } else {
            this.numGen = numGen+1;
            this.poblacion = poblacion;
        }
        this.calcularFitness(puntosValidos, img.rows);
    }

    dibujarPoblacion(canvas) {
        for (let i = 0; i < this.poblacion.length; i++) {
            this.poblacion[i].dibujarIndividuo(canvas);
        }
    }

    ordenarPoblacion() {
        this.poblacion.sort(function (a, b) {
            return b.fitness - a.fitness;
        });
    }

    calcularFitness(puntosValidos, img) {
        let promedio = 0;
        let tamPoblacion = this.poblacion.length;
        for (let i = 0; i < tamPoblacion; i++) {
            promedio += this.poblacion[i].calcularFitness(puntosValidos, img.rows);
        }
        this.ordenarPoblacion();
        this.mejor_individuo = this.poblacion[0];
        this.mejor_fitness = this.poblacion[0].fitness;
        this.fitness_promedio = promedio / tamPoblacion;
        return this.poblacion;
    }

    nuevaPoblacion(img, canvas, tamPoblacion, porcentajeSeleccion, porcentajeMutacion, porcentajeCombinar, puntosValidos) {
        let poblacion = this.poblacion;

        // Selección
        let seleccion = poblacion.slice(0, Math.floor(tamPoblacion * porcentajeSeleccion));
        let seleccionExtendida = [];
        while (seleccionExtendida.length < tamPoblacion) {
            seleccionExtendida = seleccionExtendida.concat(seleccion);
        }

        // Combinación
        let combinacion = [];
        for (let i = 0; i < Math.floor(tamPoblacion * porcentajeCombinar); i++) {
            // Selecciona aleatoria un padre y una madre
            let padre = seleccionExtendida[(Math.floor(Math.random() * seleccionExtendida.length))]
            let madre = seleccionExtendida[(Math.floor(Math.random() * seleccionExtendida.length))]
            combinacion.push(padre.cruzar(madre, img, puntosValidos));
        }

        // Mutación
        let combinacionExtendida = [];
        while (combinacionExtendida.length < tamPoblacion) {
            combinacionExtendida = combinacionExtendida.concat(combinacion);
        }
        let mutacion = [];
        for (let i = 0; i < Math.floor(tamPoblacion * porcentajeMutacion); i++) {
            let individuo = combinacionExtendida[i]
            mutacion.push(individuo.mutar(img, puntosValidos));
        }
    
        // Nueva población
        poblacion = seleccion.concat(combinacion, mutacion);
        let nuevaPoblacion = new Poblacion(img, canvas, tamPoblacion, puntosValidos, this.numGen, poblacion);
        return nuevaPoblacion;
    }
}