window.onload = function(){
	//Variables globales
	var canvas = document.querySelector("canvas");
	var ctx = canvas.getContext("2d");
	var w = canvas.width;
	var h = canvas.height;
	var delta;
	var ANCHURA_LADRILLO = 20;
	var ALTURA_LADRILLO = 10;
	var coords = {red:[0,0] , yellow:[16,0] , cyan:[32,0] , pink:[48,0] , orange:[0,8] , green:[16,8] , blue:[32,8] , grey:[48,8], silver:[64,0], gold:[112,0]};

	function intersectRect(r1left, r1top, r1right, r1bottom, r2left, r2top, r2right, r2bottom) {
		//Método para comprobar la intersección de 2 rectángulos.
		//Se emplea para comprobar cuando el vaus captura un bonus.
		return !(r2left > r1right || r2right < r1left || r2top > r1bottom || r2bottom < r1top);
	}
	
	function intersects(left, up, right, bottom, cx, cy, radius ){
		//Método para comprobar la intersección entre un rectángulo y una bola
		//Es empleado para hallar si la bola golpea la vaus o un ladrillo
		var closestX = (cx < left ? left : (cx > right ? right : cx));
		var closestY = (cy < up ? up : (cy > bottom ? bottom : cy));
		var dx = closestX - cx;
		var dy = closestY - cy;
		var side;

		var dt = Math.abs(up - cy);
		var db = Math.abs(bottom - cy);
		var dr = Math.abs(right - cx); 
		var dl = Math.abs(left - cx);
		var dm = Math.min(dt, db, dr, dl);
		switch (dm) {
			case dt: 
				side = "top";
				break;
			case db:
				side = "bottom";
				break;
			case dr:
				side = "right";
				break;
			case dl:
				side = "left";
				break;
		}

		return result = { c : ( dx * dx + dy * dy ) <= radius * radius, d : side  };
	}
	
	function colisionDisparoLadrillo(dx, dy, lx, ly){
		//Método para comprobar cuando un disparo golpea un ladrillo
		if(dx>lx && dx < lx+ANCHURA_LADRILLO){
			if(dy<=ly+ALTURA_LADRILLO && dy>=ly){
				return true;
			}else{
				return false;
			}
		}else{
			return false;
		}
	}

	function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
		//
		var testX = cx;
		var testY = cy;

		if (testX < x0)
			testX = x0;
		if (testX > (x0 + w0))
			testX = (x0 + w0);
		if (testY < y0)
			testY = y0;
		if (testY > (y0 + h0))
			testY = (y0 + h0);

		return (((cx - testX) * (cx - testX) + (cy - testY) * (cy - testY)) < r * r);
	}

	function testCollisionWithWalls(ball, w, h, abierto) {
		//Método para comprobar cuando la bola golpea las paredes
		//Devuelve si la bola muere o no
		var die = false;
		if(ball.y-ball.diameter/2<=37){
			//Colision con pared superior
			ball.angle = -ball.angle;
			ball.y = 37+ball.diameter/2;
		}

		if(ball.y+ball.diameter/2>=h){
			//Colision con pared inferior
			ball.angle = -ball.angle;
			ball.y = h-ball.diameter/2;
			die=true;
		}

		if(ball.x-ball.diameter/2<=7){
			//Colision con pared izquierda
			ball.angle = -ball.angle + Math.PI;
			ball.x = 7+ball.diameter/2;
		}
		
		if(ball.x+ball.diameter/2>=w-7){
			//Colision con pared derecha
			if(abierto){
				if(ball.y>218 || ball.y<186){
					ball.angle = -ball.angle + Math.PI;
					ball.x = w-7-ball.diameter/2;
				}			
			}else{
				ball.angle = -ball.angle + Math.PI;
				ball.x = w-7-ball.diameter/2;
			}
		}

		return die;
	}

	var calcDistanceToMove = function(delta, speed) {
		//Método que calcula los píxeles del movimiento
		return (delta*speed/1000);
	};
	
	function Brick(x,y,color,value,lifes) {
		//Constructor del ladrillo
		this.x=x;
		this.y=y;
		this.color=color;
		this.sprite = new Sprite('img/sprites.png', coords[color], [16,8]);
		this.value=value;
		this.lifes=lifes;
	}

	Brick.prototype = {
		draw: function(ctx) {
			//Método para dibujar el ladrillo
			this.sprite.render(ctx);
		}
	};

	function Ball(x, y, angle, v, diameter, sticky) {
		//Constructor de la bola
		this.x=x;
		this.y=y;
		this.angle=angle;
		this.v=v;
		this.diameter=diameter;
		this.sticky=sticky;

		this.draw = function(ctx) {
			//Método para dibujar la bola
			ctx.beginPath();
			ctx.arc(this.x,this.y,this.diameter/2,0,2*Math.PI,false);
			ctx.stroke();
			ctx.save();
			ctx.fillStyle="white";
			ctx.fill();
			ctx.restore();
		};

		this.move = function(x, y) {
			//Método para mover la bola
			if(x!=null && y!=null){
				this.x=x;
				this.y=y;
			}else{
				incX = this.v*Math.cos(this.angle);
				incY = this.v*Math.sin(this.angle);
				this.x = this.x+incX;
				this.y = this.y-incY;
			}   
		};
	}
	
	function Bonus(type, x, y){
		//Constructor del bonus
		this.type = type;
		this.x = x;
		this.y = y;
		this.width = 16;
		this.height = 8;
		this.speed = 80;
		this.sprite = new Sprite('img/sprites.png', [160,8], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
		
		this.setSprite = function(){
			//Método para setear el sprite del Bonus en función de su tipo
			if(this.type=='L'){
				this.sprite = new Sprite('img/sprites.png', [544,0], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}else if(this.type=='E'){
				this.sprite = new Sprite('img/sprites.png', [288,8], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}else if(this.type=='C'){
				this.sprite = new Sprite('img/sprites.png', [160,8], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}else if(this.type=='S'){
				this.sprite = new Sprite('img/sprites.png', [160,0], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}else if(this.type=='B'){
				this.sprite = new Sprite('img/sprites.png', [416,0], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}else if(this.type=='D'){
				this.sprite = new Sprite('img/sprites.png', [288,0], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}else if(this.type=='P'){
				this.sprite = new Sprite('img/sprites.png', [416,8], [16,8], 0.5, [0,1,2,3,4,5,6,7]);
			}
		}
	
		this.draw = function(ctx){
			//Método para dibujar el bonus
			ctx.save();
			ctx.translate(this.x,this.y);
			this.sprite.render(ctx);
			ctx.restore();
		};
		
		this.move = function(){
			//Método para mover el bonus
			this.sprite.update(delta);
			var v = calcDistanceToMove(delta, this.speed);
			if(v>3){
				v=3;
			}
			this.y += v;
		};
	}
	
	function Disparo(x,y){
		//Constructor del disparo
		this.x = x;
		this.y = y;
		this.width = 6;
		this.height = 12;
		this.sprite = new Sprite('img/sprites.png', [871,58], [5,12], 0.5, [0,1]);
		this.speed = 200;
		
		this.draw = function(ctx){
			//Método para dibujar el disparo
			ctx.save();
			ctx.translate(this.x,this.y);
			this.sprite.render(ctx);
			ctx.restore();
		};
		
		this.move = function(){
			//Método para mover el disparo
			this.sprite.update(delta);
			var v = calcDistanceToMove(delta, this.speed);
			if(v>3){
				v=3;
			}
			this.y -= v;
		};
	}

	var GF = function() {
		//Variables de la animación
		var frameCount = 0;
		var lastTime;
		var fpsContainer;
		var fps, oldTime = 0;
		var balls = [];
		var bricks = [];
		var goldbricks=[];
		var bricksLeft;  
		var lifes = 3;
		var nivel;
		var inputStates = {left:0, right:0, space:0};
		var currentGameState =  "gameRunning";
		var music;
		var sounds;
		var bonuses = [];
		var disparos = [];
		var actualbonus = 'O';
		var tirarbonus = true;
		var puedegolpear = true;
		var log = true;
		var disparar = false;
		var colortexto = "white";
		var terrainpattern;
		var finnivel = false;
		var score = 0;

	  // VAUS en objeto literal 
		var paddle = {
			dead: false,
			x: 10,
			y: 325,
			width: 32,
			height: 8,
			speed: 300, // pixels/s 
			sticky: false,
			sprite: new Sprite('img/sprites.png', [224,40], [32,8], 16, [0,1])
		};
		
		function drawVaus(x, y) {
			//Método para dibujar la VAUS
			ctx.save();
			ctx.translate(paddle.x,paddle.y);
			paddle.sprite.render(ctx);
			ctx.restore();
		}

		var createBricks = function(pNivel){
			//Método para crear los ladrillos
			nivel = pNivel;
			goldbricks=[];
			bricks=[];
			if(nivel==1){
				terrain = new Sprite('img/sprites.png', [0,80], [24,32]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				var x = 8;
				while(x<w-12){
					var b = new Brick(x,80,'grey',50,1)
					bricks.push(b);
					var b = new Brick(x,88,'red',90,1)
					bricks.push(b);
					var b = new Brick(x,96,'yellow',120,1)
					bricks.push(b);
					var b = new Brick(x,104,'blue',100,1)
					bricks.push(b);
					var b = new Brick(x,112,'pink',110,1)
					bricks.push(b);
					var b = new Brick(x,120,'green',80,1)
					bricks.push(b);
					x=x+16;
				}
			}else if(nivel==2){
				terrain = new Sprite('img/sprites.png', [48,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				var nBricks = 1;
				var rowCount = 1;
				var y = 50;
				while(rowCount<=12){
					var count = 0;
					var x = 8;
					while(count<nBricks){
						count++;
						if(count==1){
							var b = new Brick(x,y,'grey',50,1)
							bricks.push(b);
						}else if(count==2){
							var b = new Brick(x,y,'orange',60,1)
							bricks.push(b);
						}else if(count==3){
							var b = new Brick(x,y,'cyan',70,1)
							bricks.push(b);
						}else if(count==4){
							var b = new Brick(x,y,'green',80,1)
							bricks.push(b);
						}else if(count==5){
							var b = new Brick(x,y,'red',90,1)
							bricks.push(b);
						}else if(count==6){
							var b = new Brick(x,y,'blue',100,1)
							bricks.push(b);
						}else if(count==7){
							var b = new Brick(x,y,'pink',110,1)
							bricks.push(b);
						}else if(count==8){
							var b = new Brick(x,y,'yellow',120,1)
							bricks.push(b);
						}else if(count==9){
							var b = new Brick(x,y,'grey',50,1)
							bricks.push(b);
						}else if(count==10){
							var b = new Brick(x,y,'orange',60,1)
							bricks.push(b);
						}else if(count==11){
							var b = new Brick(x,y,'cyan',70,1)
							bricks.push(b);
						}else if(count==12){
							var b = new Brick(x,y,'green',80,1)
							bricks.push(b);
						}
						x=x+16;
					}
					rowCount++;
					nBricks++;
					y=y+8;
				}
				x=8;
				var columnCount=1;
				while(x<w-12){
					if(columnCount==13){
						var b = new Brick(x,y,'red',90,1)
						bricks.push(b);
					}else{
						var aux = Math.floor(nivel/8);
						var b = new Brick(x,y,'silver',50*nivel,2+aux);
						console.log(2+aux);
						bricks.push(b);
					}
					columnCount++;
					x=x+16;
				}
			}else if(nivel==3){
				terrain = new Sprite('img/sprites.png', [96,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				var rowCount=1;
				var y = 50;
				while(rowCount<=8){
					var x = 8;
					if(rowCount==1){
						var columnCount=1;
						while(columnCount<=13){
							var b = new Brick(x,y,'green',80,1)
							bricks.push(b);
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==2){
						var columnCount=1;
						while(columnCount<=13){
							if(columnCount>3){
								var b = new Brick(x,y,'gold',100,-1)
								goldbricks.push(b);
							}else{
								var b = new Brick(x,y,'grey',50,1)
								bricks.push(b);
							}
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==3){
						var columnCount=1;
						while(columnCount<=13){
							var b = new Brick(x,y,'red',90,1)
							bricks.push(b);
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==4){
						var columnCount=1;
						while(columnCount<=13){
							if(columnCount<10){
								var b = new Brick(x,y,'gold',100,-1)
								goldbricks.push(b);
							}else{
								var b = new Brick(x,y,'grey',50,1)
								bricks.push(b);
							}
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==5){
						var columnCount=1;
						while(columnCount<=13){
							var b = new Brick(x,y,'pink',110,1)
							bricks.push(b);
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==6){
						var columnCount=1;
						while(columnCount<=13){
							if(columnCount>3){
								var b = new Brick(x,y,'gold',100,-1)
								goldbricks.push(b);
							}else{
								var b = new Brick(x,y,'blue',100,1)
								bricks.push(b);
							}
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==7){
						var columnCount=1;
						while(columnCount<=13){
							var b = new Brick(x,y,'cyan',70,1)
							bricks.push(b);
							columnCount++;
							x=x+16;
						}
					}else if(rowCount==8){
						var columnCount=1;
						while(columnCount<=13){
							if(columnCount<10){
								var b = new Brick(x,y,'gold',100,-1)
								goldbricks.push(b);
							}else{
								var b = new Brick(x,y,'cyan',70,1)
								bricks.push(b);
							}
							columnCount++;
							x=x+16;
						}
					}
					rowCount++;
					y=y+16;
				}
			}else if(nivel==4){
				terrain = new Sprite('img/sprites.png', [144,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				var rowCount = 1;
				var y = 80;
				var i = 0;
				while(rowCount<=13){
					var x = 24;
					var columnCount = 1;
					var colores = ['orange', 'cyan', 'green', 'silver', 'blue', 'yellow', 'grey'];
					var puntuaciones = [60,70,80,50*nivel,100,120,50];
					while(columnCount<=11){
						if(columnCount!=6){
							var auxlifes = 1;
							if(colores[i]=='silver'){
								auxlifes=2+nivel%8;
							}
							var b = new Brick(x,y,colores[i],puntuaciones[i],auxlifes);
							bricks.push(b);
							if(i==colores.length-1){
								i=0;
							}else{
								i++;
							}
						}
						x=x+16;
						columnCount++;
					}
					rowCount++;
					y=y+8;
					i=i-2;
					if(i<0){
						i=i+colores.length;
					}
				}
			}else if(nivel==5){
				terrain = new Sprite('img/sprites.png', [0,80], [24,32]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
			
				var coordenadasPlata = [[56,82],[72,82],[88,82],[104,82],[120,82],[136,82],[152,82],[56,90],[72,90],[88,90],[104,90],[120,90],[136,90],[152,90],[40,98],[56,98],[88,98],[104,98],[120,98],[152,98],[168,98],[40,106],[56,106],[88,106],[104,106],[120,106],[152,106],[168,106],[24,114],[40,114],[56,114],[72,114],[88,114],[104,114],[120,114],[136,114],[152,114],[168,114],[184,114],[24,122],[40,122],[56,122],[72,122],[88,122],[104,122],[120,122],[136,122],[152,122],[168,122],[184,122],[24,130],[40,130],[56,130],[72,130],[88,130],[104,130],[120,130],[136,130],[152,130],[168,130],[184,130],[24,138],[56,138],[72,138],[88,138],[104,138],[120,138],[152,138],[184,138],[24,146],[56,146],[152,146],[184,146],[72,154],[88,154],[120,154],[136,154],[72,162],[88,162],[120,162],[136,162]]
				var coordenadasOro = [[56,50],[56,58],[72,66],[72,74],[136,66],[136,74],[152,58],[152,50]]
				var coordenadasRojo = [[72,98],[72,106],[136,98],[136,106]];
				
				for(coord of coordenadasPlata){
					var b = new Brick(coord[0],coord[1],'silver',50*nivel,2+nivel%8)
					bricks.push(b);
				}
				
				for(coord of coordenadasOro){
					var b = new Brick(coord[0],coord[1],'gold',100,-1)
					goldbricks.push(b);
				}
				
				for(coord of coordenadasRojo){
					var b = new Brick(coord[0],coord[1],'red',90,1)
					bricks.push(b);
				}
			}else if(nivel==6){
				terrain = new Sprite('img/sprites.png', [48,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				var x=8;
				var y=80;
				var rowCount = 1;
				var columnCount = 1;
				
				while(columnCount<=7){
					while(rowCount<=13){
						if(rowCount==12){
							var b = new Brick(x,y,'orange',60,1)
							bricks.push(b);
						}else{
							if(columnCount==1 || columnCount==7){
								var b = new Brick(x,y,'blue',100,1)
								bricks.push(b);
							}else if(columnCount==2 || columnCount==6){
								if(rowCount==6){
									var b = new Brick(x,y,'gold',100,-1)
									goldbricks.push(b);
								}else{
									var b = new Brick(x,y,'red',90,1)
									bricks.push(b);
								}
							}else if(columnCount==3 || columnCount==5){
								if(rowCount==6){
									var b = new Brick(x,y,'gold',100,-1)
									goldbricks.push(b);
								}else{
									var b = new Brick(x,y,'green',80,1)
									bricks.push(b);
								}
							}else{
								if(rowCount==6){
									var b = new Brick(x,y,'gold',100,-1)
									goldbricks.push(b);
								}else{
									var b = new Brick(x,y,'cyan',70,1)
									bricks.push(b);
								}
							}
						}
						rowCount++;
						y=y+8
					}
					rowCount=0;
					y=80;
					x=x+32
					columnCount++;
				}
			}else if(nivel==7){
				terrain = new Sprite('img/sprites.png', [96,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				
				listaladrillos = [[88,80,"yellow",120],[104,80,"yellow",120],[120,80,"pink",110],[72,88,"yellow",120],[88,88,"yellow",120],[104,88,"pink",110],[120,88,"pink",110],[136,88,"blue",100],[56,96,"yellow",120],[72,96,"yellow",120],[88,96,"pink",110],[104,96,"pink",110],[120,96,"blue",100],[136,96,"blue",100],[152,96,"red",90],[56,104,"yellow",120],[72,104,"pink",110],[88,104,"pink",110],[104,104,"blue",100],[120,104,"blue",100],[136,104,"red",90],[152,104,"red",90],[40,112,"yellow",120],[56,112,"pink",110],[72,112,"pink",110],[88,112,"blue",100],[104,112,"blue",100],[120,112,"red",90],[136,112,"red",90],[152,112,"green",80],[168,112,"green",80],[40,120,"pink",110],[56,120,"pink",110],[72,120,"blue",100],[88,120,"blue",100],[104,120,"red",90],[120,120,"red",90],[136,120,"green",80],[152,120,"green",80],[168,120,"cyan",70],[40,128,"pink",110],[56,128,"blue",100],[72,128,"blue",100],[88,128,"red",90],[104,128,"red",90],[120,128,"green",80],[136,128,"green",80],[152,128,"cyan",70],[168,128,"cyan",70],[40,136,"blue",100],[56,136,"blue",100],[72,136,"red",90],[88,136,"red",90],[104,136,"green",80],[120,136,"green",80],[136,136,"cyan",70],[152,136,"cyan",70],[168,136,"orange",60],[40,144,"blue",100],[56,144,"red",90],[72,144,"red",90],[88,144,"green",80],[104,144,"green",80],[120,144,"cyan",70],[136,144,"cyan",70],[152,144,"orange",60],[168,144,"orange",60],[40,152,"red",90],[56,152,"red",90],[72,152,"green",80],[88,152,"green",80],[104,152,"cyan",70],[120,152,"cyan",70],[136,152,"orange",60],[152,152,"orange",60],[168,152,"grey",50],[56,160,"green",80],[72,160,"green",80],[88,160,"cyan",70],[104,160,"cyan",70],[120,160,"orange",60],[136,160,"orange",60],[152,160,"grey",50],[56,168,"green",80],[72,168,"cyan",70],[88,168,"cyan",70],[104,168,"orange",60],[120,168,"orange",60],[136,168,"grey",50],[152,168,"grey",50],[72,176,"cyan",70],[88,176,"orange",60],[104,176,"orange",60],[120,176,"grey",50],[136,176,"grey",50],[88,184,"orange",60],[104,184,"grey",50],[120,184,"grey",50]]
				
				for(l of listaladrillos){
					var nuevo = new Brick(l[0],l[1],l[2],l[3],1);
					bricks.push(nuevo);
				}
				
			}else if(nivel==8){
				terrain = new Sprite('img/sprites.png', [144,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				
				var ladrillosoro = [[56,80],[88,80],[120,80],[152,80],[24,88],[184,88],[24,96],[40,96],[72,96],[136,96],[168,96],[184,96],[24,112],[88,112],[120,112],[184,112],[56,120],[152,120],[56,136],[152,136],[24,144],[88,144],[120,144],[168,144],[24,160],[40,160],[72,160],[136,160],[168,160],[184,160],[24,168],[184,168],[56,176,],[88,176],[120,176],[152,176]];
				
				var ladrilloscolores =[[106,104,"grey",50],[106,112,"orange",60],[106,120,"cyan",70],[106,128,"green",80],[106,136,"red",90],[106,144,"blue",100],[106,152,"pink",110]];
				
				for(l of ladrilloscolores){
					var nuevo = new Brick(l[0],l[1],l[2],l[3],1);
					bricks.push(nuevo);
				}
				
				for(l2 of ladrillosoro){
					var b = new Brick(l2[0],l2[1],'gold',100,-1)
					goldbricks.push(b);
				}
				
			}else if(nivel==9){
				terrain = new Sprite('img/sprites.png', [0,80], [24,32]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				
				var ladrillosoro = [[24,50],[24,58],[24,66],[24,74],[40,74],[56,74],[56,66],[56,58],[56,50],[184,50],[184,58],[184,66],[184,74],[168,74],[152,74],[152,66],[152,58],[152,50]];
				
				var ladrilloscolores = [[40,58,"green",80],[40,66,"cyan",70],[168,58,"green",80],[168,66,"cyan",70],[72,90,"pink",110],[72,98,"pink",110],[72,106,"pink",110],[72,114,"pink",110],[72,122,"pink",110],[88,90,"grey",50],[104,90,"grey",50],[120,90,"grey",50],[88,98,"orange",60],[104,98,"orange",60],[120,98,"orange",60],[88,106,"cyan",70],[104,106,"cyan",70],[120,106,"cyan",70],[88,114,"green",80],[104,114,"green",80],[120,114,"green",80],[88,120,"red",90],[104,120,"red",90],[120,120,"red",90],[88,128,"blue",100],[104,128,"blue",100],[120,128,"blue",100],[136,90,"yellow",120],[136,98,"yellow",120],[136,106,"yellow",120],[136,114,"yellow",120],[136,122,"yellow",120]]
				
				for(l of ladrilloscolores){
					var nuevo = new Brick(l[0],l[1],l[2],l[3],1);
					bricks.push(nuevo);
				}
				
				for(l2 of ladrillosoro){
					var b = new Brick(l2[0],l2[1],'gold',100,-1)
					goldbricks.push(b);
				}
				
			}else if(nivel==10){
				terrain = new Sprite('img/sprites.png', [48,80], [32,31]);
				terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
				
				var x = 24;
				var y = 38;
				
				while(y<174){
					if(y!=46){
						var b = new Brick(x,y,'gold',100,-1)
						goldbricks.push(b);
					}
					y=y+8;
				}
				
				while(x<w-10){
					var b = new Brick(x,y,'gold',100,-1)
					goldbricks.push(b);
					x=x+16
				}
				
				var ladrilloscolores = [[56,110,"blue",100],[72,118,"blue",100],[72,102,"blue",100],[88,126,"blue",100],[88,94,"blue",100],[104,134,"blue",100],[104,86,"blue",100],[120,78,"blue",100],[120,142,"blue",100],[136,86,"blue",100],[136,134,"blue",100],[152,94,"blue",100],[152,126,"blue",100],[168,102,"blue",100],[168,118,"blue",100],[184,110,"blue",100],[72,110,"cyan",70],[88,118,"cyan",70],[88,102,"cyan",70],[104,126,"cyan",70],[104,94,"cyan",70],[120,134,"cyan",70],[120,86,"cyan",70],[136,94,"cyan",70],[136,126,"cyan",70],[152,102,"cyan",70],[152,118,"cyan",70],[168,110,"cyan",70],[88,110,"grey",50],[104,102,"grey",50],[104,118,"grey",50],[120,94,"grey",50],[120,126,"grey",50],[136,118,"grey",50],[152,110,"grey",50],[136,102,"grey",50],[104,110,"cyan",70],[136,110,"cyan",70],[120,118,"cyan",70],[120,102,"cyan",70]];
				
				for(l of ladrilloscolores){
					var nuevo = new Brick(l[0],l[1],l[2],l[3],1);
					bricks.push(nuevo);
				}
				
				var aux = Math.floor(nivel/8);
				var b = new Brick(120,110,'silver',50*nivel,2+aux);
				bricks.push(b);
			}
		}

		var drawBricks = function(){
			//Método para dibujar los ladrillos
			for(brick of bricks){
				ctx.save();
				ctx.translate(brick.x,brick.y);    
				brick.draw(ctx);
				ctx.restore();
			}
			
			for(brick of goldbricks){
				ctx.save();
				ctx.translate(brick.x,brick.y);    
				brick.draw(ctx);
				ctx.restore();
			}
		};

		var measureFPS = function(newTime) {
			//Método para medir los FPS
			if (lastTime === undefined) {
				lastTime = newTime;
				return;
			}

			var diffTime = newTime - lastTime;

			if (diffTime >= 1000) {
				fps = frameCount;
				frameCount = 0;
				lastTime = newTime;
			}
			
			fpsContainer.innerHTML = 'FPS: ' + fps;
			frameCount++;
		};
		
		function inicializarGestorTeclado(){
			//Método para inicializar el gestor del teclado
			window.onkeydown = function (e) {
				//Detecta la pulsación de una tecla
				var code = e.keyCode ? e.keyCode : e.which;
				if (code === 37) { //Flecha arriba
					inputStates.left = 1;
				} else if (code === 39) { //Flecha abajo
					inputStates.right = 1;
				} else if (code === 32) { //Espacio
					inputStates.space = 1;
				} else if (code == 80 || code == 112){
					if(currentGameState == "gamePaused"){
						currentGameState =  "gameRunning";
					}else{
						currentGameState =  "gamePaused";
					}
				}
			};

			window.onkeyup = function (e) {
				//Detecta la liberación de una tecla
				var code = e.keyCode ? e.keyCode : e.which;
				if (code === 37) { //Flecha arriba
					inputStates.left = 0;
				} else if (code === 39) { //Flecha abajo
					inputStates.right = 0;
				} else if (code === 32) { //Espacio
					inputStates.space = 0;
				}
			};
		}
		
		function clearCanvas() {
			//Reestablece el fondo
			ctx.clearRect(0, 0, w, h);  
			//Se pinta todo el canvas de negro
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,w,h);	
			//Se pinta el fondo del juego con un patrón
			ctx.fillStyle = terrainPattern;
			ctx.fillRect(5,32,w-7,h);			
		}
		
		function cambiartirarbonus(){
			//Método auxiliar
			tirarbonus = true;
		}
		
		function comprobarBonus(){
			//Método que comprueba la caída de un bonus
			//Es llamado cuando un ladrillo es destruído
			if(actualbonus!='D' || balls.length==1 && tirarbonus===true ){
				var random = Math.floor((Math.random() * 100));
				if(random == 1 || random == 51){
					var type = 'S';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else if(random == 13 || random == 61){
					var type = 'C';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else if(random == 29 || random == 79){
					var type = 'D';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else if(random == 41 || random == 91){
					var type = 'E';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else if(random == 8 || random == 58){
					var type = 'B';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else if(random == 23 || random == 73){
					var type = 'P';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else if(random == 39 || random == 89){
					var type = 'L';
					tirarbonus = false;
					setTimeout(cambiartirarbonus, 1000);
				}else{
					var type = 'O';
				}
				return type;
			}else{
				var type = 'O';
			}
			return type;
		}
	  
		function testBrickCollision(ball) {
			//Método que comprueba si la bola golpea algún ladrillo
			for(brick of bricks){
				testBrickCollision2(ball, brick)
			}
			
			for(brick of goldbricks){
				testBrickCollision2(ball, brick)
			}
		}	
		
		function testBrickCollision2(ball, brick){
			//Método que comprueba la colisión entre una bola y un ladrillo
			var rdo = intersects(brick.x, brick.y, brick.x+ANCHURA_LADRILLO, brick.y+ALTURA_LADRILLO, ball.x, ball.y, ball.diameter/2 )
				var remove=false;
				var golpe = false;
				if(rdo.c==true){
					//Si la bola golpea un ladrillo, cambia el angulo de la bola
					sounds.play('brick');
					if(rdo.d=="left"){
						ball.angle = -ball.angle + Math.PI;
						golpe=true;
					}else if(rdo.d=="right"){
						ball.angle = -ball.angle + Math.PI;
						golpe=true;
					}else if(rdo.d=="top"){
						ball.angle = -ball.angle;
						golpe=true;
					}else if(rdo.d=="bottom"){
						ball.angle = -ball.angle;
						golpe=true;
					}
					
					if(golpe==true){
						if(brick.lifes>0){
							brick.lifes--;
						}
						if(brick.lifes==0){
							score = score + brick.value;
							remove=true;
						}
					}
					

					if(remove==true){
						//Si un ladrillo ha sido golpeado, se elimina del array de ladrillos y se comprueba si tira un bonus
						var index = bricks.indexOf(brick);
						if (index > -1) {
							bricks.splice(index, 1);
							ball.v=ball.v+0.1;
						}					
						var bonus = comprobarBonus();
						if(bonus != 'O'){
							var b = new Bonus(bonus, brick.x, brick.y);
							b.setSprite();
							bonuses.push(b);
						}
					}
				}
		}

		function displayLifes(ctx) {
			//Método para dibujar el número de vidas
			sprite = new Sprite('img/sprites.png', [150,48], [17,8]);
			if(lifes>1){
				ctx.save();
				ctx.translate(5, h-10);
				sprite.render(ctx);
				ctx.restore();
			}
			if(lifes>2){
				ctx.save();	
				ctx.translate(25, h-10);
				sprite.render(ctx);
				ctx.restore();			
			}
			if(lifes>3){
				ctx.save();	
				ctx.translate(45, h-10);
				sprite.render(ctx);
				ctx.restore();
			}
			if(lifes>4){
				ctx.save();	
				ctx.translate(65, h-10);
				sprite.render(ctx);
				ctx.restore();
			}
			if(lifes>5){
				ctx.save();	
				ctx.translate(85, h-10);
				sprite.render(ctx);
				ctx.restore();
			}
			if(lifes>6){
				ctx.save();	
				ctx.translate(105, h-10);
				sprite.render(ctx);
				ctx.restore();
			}
			if(lifes>7){
				ctx.save();	
				ctx.translate(125, h-10);
				sprite.render(ctx);
				ctx.restore();
			}
		}
		
		function displayLevel(ctx){
			//Método para dibujar el nivel
			ctx.font="15px Georgia";
			ctx.fillStyle="white";
			ctx.fillText("Nivel: "+nivel,5,20);
		}
		
		function displayScore(ctx){
			ctx.save();
			ctx.font="15px Georgia";
			ctx.fillStyle="white";
			if(score<10){
				ctx.translate(160,0);
			}else if(score<100){
				ctx.translate(152,0);
			}else if(score<1000){
				ctx.translate(144,0);
			}else if(score<10000){
				ctx.translate(136,0);
			}else if(score<100000){
				ctx.translate(130,0);
			}else if(score<1000000){
				ctx.translate(120,0);
			}
			
			
			ctx.fillText("Score: "+score,5,20);
			ctx.restore();
		}
		
		function displayPause(ctx){
			ctx.save();
			ctx.font="30px Georgia";
			ctx.fillStyle="white";
			ctx.translate(w/2-50,h/2-20);
			ctx.fillText("PAUSE",5,20);
			ctx.restore();
		}
		
		function displayWin(ctx){
			ctx.save();
			ctx.font="30px Georgia";
			ctx.fillStyle="yellow";
			ctx.translate(w/2-60,h/2-40);
			ctx.fillText("You Win",5,20);
			ctx.restore();
			
			ctx.save();
			ctx.font="30px Georgia";
			ctx.fillStyle="yellow";
			if(score<10){
				ctx.translate(w/2-60,h/2-10);
			}else if(score<100){
				ctx.translate(w/2-68,h/2-10);
			}else if(score<1000){
				ctx.translate(w/2-76,h/2-10);
			}else if(score<10000){
				ctx.translate(w/2-84,h/2-10);
			}else if(score<100000){
				ctx.translate(w/2-90,h/2-10);
			}else if(score<1000000){
				ctx.translate(w/2-100,h/2-10);
			}
			ctx.fillText("Score: "+score,5,20);
			ctx.restore();
			
		}
		
		function cambiarDisparar(){
			//Método auxiliar
			disparar = true;
		}
		
		function testDisparos(){
			//Método para comprobar si un disparo golpea un ladrillo
			for(d of disparos){
				for(l of bricks){
					if(colisionDisparoLadrillo(d.x, d.y, l.x, l.y)){
						if(l.lifes>0){
							l.lifes=l.lifes-1
						}
						if(l.lifes==0){
							var i = bricks.indexOf(l);
							bricks.splice(i,1);
							score = score + l.value;
						}
						i = disparos.indexOf(d);
						disparos.splice(i,1);
						sounds.play('brickshooted');
					}
				}
				
				for(l of goldbricks){
					if(colisionDisparoLadrillo(d.x, d.y, l.x, l.y)){
						sounds.play('brickshooted');
						i = disparos.indexOf(d);
						disparos.splice(i,1);
					}
				}
			}
			
			if(bricks.length==0){
				finnivel=true;
			}
		}
		
		function updateDisparos(){
			//Método para actualizar los disparos
			for(disparo of disparos){
				if(disparo.y<37){
					var i = disparos.indexOf(disparo);
					bonuses.splice(i,1);
				}else{
					disparo.move();
					disparo.draw(ctx);
				}
			}
		}
		
		var updatePaddlePosition = function() {
			//Método para actualizar la posición de la VAUS
			paddle.sprite.update(delta);
			var incX = Math.ceil(calcDistanceToMove(delta, paddle.speed));

			//Actualiza la posición
			if(inputStates.left===1){
				paddle.x=paddle.x-incX;
			}
			if(inputStates.right===1){
				paddle.x=paddle.x+incX;
			}
			
			//Dispara o saca la bola
			if(inputStates.space===1){
				for (var i = balls.length - 1; i >= 0; i--) {
					var ball = balls[i];
					if(ball.sticky == true){
						ball.sticky = false;
						if(inputStates.right){
							ball.angle = ball.angle * (ball.angle < 0 ? 0.5 : 1.5);
						}else if(inputStates.left){
							ball.angle = ball.angle * (ball.angle > 0 ? 0.5 : 1.5);
						}
						ball.angle=-ball.angle;
						console.log(ball.angle);
						ball.angle = corregirAngulo(ball);
						console.log(ball.angle);
						
						if(actualbonus=='C'){
							//Si el bonus actual es C, hay que evitar que golpee en un tiempo corto porque sino no puede sacar
							puedegolpear=false;
							setTimeout(cambiarpuedegolpear, 300);
						}
						
						sounds.play('paddle');
					}
				}
				
				if(actualbonus == 'L' && disparar){
					var d1 = new Disparo(paddle.x+5, paddle.y);
					var d2 = new Disparo(paddle.x+paddle.width-10, paddle.y);
					disparos.push(d1);
					disparos.push(d2);
					disparar = false;
					setTimeout(cambiarDisparar, 300);
					sounds.play('shoot');
				}
			}
			
			//Rebota la vaus
			if(paddle.x<=7){
				paddle.x=7
			}
			if(paddle.x+paddle.width>=w-7){
				paddle.x=w-paddle.width-7;
			}
			
			//Pega la bola a la VAUS
			if(paddle.sticky == true){
				for (var i = balls.length - 1; i >= 0; i--) {
					var ball = balls[i];
					if(ball.sticky==true){
						var x = (paddle.x+(paddle.width/2))-(ball.diameter/2);
						var y = (paddle.y+(paddle.height/2))-(ball.diameter/2);
						ball.move(x,y);
						ball.draw(ctx);
					}
				}
			}
		}
		
		function cambiarpuedegolpear(){
			//Método auxiliar
			puedegolpear = true;
		}
		
		function corregirAngulo(ball){
			//Se corrige el angulo para que la bola no rebote hacia abajo después de rebotar en el paddle.
			var angulo = ball.angle;
			console.log(angulo);
			while(angulo>2*Math.PI){
				angulo = angulo - 2*Math.PI
			}
			while(angulo<-2*Math.PI){
				angulo = angulo + 2*Math.PI;
			}
			if(angulo>0){
				if(angulo<Math.PI/6 || angulo>3/2*Math.PI && angulo < 2*Math.PI){
					angulo = Math.PI/6;
					console.log("Ángulo Corregido: De "+ball.angle+" a "+angulo);
				}else if(angulo>5/6*Math.PI && angulo<=3/2*Math.PI){
					angulo = (5/6)*Math.PI;
					console.log("Ángulo Corregido: De "+ball.angle+" a "+angulo);
				}
			}else{
				if(angulo<-11*Math.PI/6 || angulo<0 && angulo>-Math.PI/2){
					angulo = -(11*Math.PI)/6;
					console.log("Ángulo Corregido: De "+ball.angle+" a "+angulo);
				}else if(angulo<=-Math.PI/2 && angulo>-7/6*Math.PI){
					angulo = -7/6*Math.PI;
					console.log("Ángulo Corregido: De "+ball.angle+" a "+angulo);
				}
			}
			console.log(angulo);
			return angulo;
		}
		
		function testPaddleCollision(ball){
			//Comprueba la colisión de la VAUS con la bola
			if(circRectsOverlap(paddle.x,paddle.y,paddle.width,paddle.height, ball.x, ball.y, ball.diameter/2) == true && puedegolpear == true){
				if(paddle.sticky==true){
					ball.sticky = true;
				}else{
					if(inputStates.right){
						ball.angle = ball.angle * (ball.angle < 0 ? 0.5 : 1.5);
					}else if(inputStates.left){
						ball.angle = ball.angle * (ball.angle > 0 ? 0.5 : 1.5);
					}
					ball.angle=-ball.angle;
					ball.angle=corregirAngulo(ball);
					
					sounds.play('paddle');
				}
				puedegolpear = false;
				setTimeout(cambiarpuedegolpear, 16);
			}
		}

		function updateBalls() {
			//Actualiza las bolas
			for (var i = balls.length - 1; i >= 0; i--) {
				var ball = balls[i];
				if(ball.sticky==false){
					ball.move();
					
					if(actualbonus == 'B'){
						if(ball.x>=w){
							//Si el bonus actual es B y la bola está mas allá del límite del canvas, quiere decir que pasa de nivel
							finnivel=true;
						}else{
							var die = testCollisionWithWalls(ball, w, h, true);
						}
					}else{
						var die = testCollisionWithWalls(ball, w, h, false);
					}
					
					if(die==true){
						sounds.play('lose');
						var i = balls.indexOf(ball);
						balls.splice(i,1);
					}

					bricksLeft = testBrickCollision(ball);
					if(bricksLeft==0){
						finnivel=true;
					}
					testPaddleCollision(ball);
					
					ball.draw(ctx);
				}
			}
			
			if(balls.length==0){
				paddle.dead=true;
			}			
		}
		
		function aplicarBonus(bonus){
			//Aplica un bonus después de cogerlo
			revertirBonus();
			actualbonus = bonus.type;
			if(bonus.type=='L'){
				paddle.sprite = new Sprite('img/sprites.png', [800,32], [32,8], 16, [0,1,2,3]);
				disparar = true;
			}else if(bonus.type=='E'){
				paddle.sprite = new Sprite('img/sprites.png', [32,48], [40,8], 16, [0,1]);
				paddle.width = 40;
			}else if(bonus.type=='C'){
				paddle.sticky = true;
			}else if(bonus.type=='S'){
				for (var i = balls.length - 1; i >= 0; i--) {
					var ball = balls[i];
					ball.speed= ball.speed-1;
					if(ball.speed < 0.5){
						ball.speed = 0.5;
					}
				}
			}else if(bonus.type=='D'){
				for (var i = balls.length - 1; i >= 0; i--) {
					var angulo = balls[i].angle;
					varangaux = Math.round(angulo*180/Math.PI);
					varangaux2 = varangaux;
					varangaux -= 30;
					varangaux2 += 30;
					varangaux = varangaux * (Math.PI / 180);
					varangaux2 = varangaux2 * (Math.PI / 180);
					
					var b1 = new Ball(balls[i].x, balls[i].y, varangaux, balls[i].v, balls[i].diameter, false);
					balls.push(b1);
					var b2 = new Ball(balls[i].x, balls[i].y, varangaux2, balls[i].v, balls[i].diameter, false);
					balls.push(b2);
				}
			}else if(bonus.type=='P'){
				lifes = lifes + 1;
			}
			
			sounds.play('bonus');
		}
		
		function revertirBonus(){
			//Revierte los efectos de un bonus
			if(actualbonus=='L'){
				paddle.sprite = new Sprite('img/sprites.png', [224,40], [32,8], 16, [0,1]);
				disparar = false;
			}else if(actualbonus=='E'){
				paddle.sprite = new Sprite('img/sprites.png', [224,40], [32,8], 16, [0,1]);
				paddle.width = 32;
			}else if(actualbonus=='C'){
				paddle.sticky = false;
				for (var i = balls.length - 1; i >= 0; i--) {
					var ball = balls[i];
					ball.sticky = false;
				}
			}else if(actualbonus=='B'){
				actualbonus='O';
			}
		}
		
		function drawBoundaries(){
			//Pinta los tubos que establecen los límites
			var spritetopleft = new Sprite('img/sprites.png', [8,31], [12,10]);
			var spriterect = new Sprite('img/sprites.png', [8,65], [7,12]);
			var spritetopright = new Sprite('img/sprites.png', [20,31], [12,10]);
			var spriteabertura = new Sprite('img/sprites.png', [32,31], [32,9]);
			var spriteaberturaabierta = new Sprite('img/sprites.png', [97,31], [41,9]);
			
			//Se pinta el techo
			ctx.save();
			ctx.translate(0,30);
			spritetopleft.render(ctx);
			ctx.restore();
			var x = 12 + 12;
			while(x<=222){
				if(x==60 || x==159){
					x=x-12;
					ctx.save();
					ctx.translate(x,30);
					spriteabertura.render(ctx);
					ctx.restore();
					x=x+44;
					if(x==92){
						ctx.save();
						ctx.translate(x,31);
						ctx.rotate(Math.PI/2);
						spriterect.render(ctx);
						ctx.restore();
						x=x+7;
					}
				}else{
					ctx.save();
					ctx.translate(x,31);
					ctx.rotate(Math.PI/2);
					spriterect.render(ctx);
					ctx.restore();
					x=x+12;
				}
			}
			x=w-12;
			ctx.save();
			ctx.translate(x,30);
			spritetopright.render(ctx);
			ctx.restore();
			
			//Se pintan las paredes laterales
			var y = 36;
			var count = 0;
			while(y<=350){
				if(count%3==0){
					ctx.save();
					ctx.translate(-1,y+32);
					ctx.rotate(3*Math.PI/2);
					spriteabertura.render(ctx);
					ctx.restore();	
					
					ctx.save();
					ctx.translate(w+1,y);
					ctx.rotate(Math.PI/2);
					if(count==3*3 && actualbonus=='B'){
						spriteaberturaabierta.render(ctx);
					}else{
						spriteabertura.render(ctx);
					}
					ctx.restore();	

					y=y+32;
				}else{
					ctx.save();
					ctx.translate(0,y);
					spriterect.render(ctx);
					ctx.restore();
					
					ctx.save();
					ctx.translate(w,y+9);
					ctx.rotate(Math.PI);
					spriterect.render(ctx);
					ctx.restore();
					y=y+9;
				}
				
				count++;
			}
			
			/*ctx.beginPath();
			ctx.arc(215,186,1,0,2*Math.PI,false);
			ctx.stroke();
			ctx.save();
			ctx.fillStyle="yellow";
			ctx.fill();
			ctx.restore();
			
			
			ctx.beginPath();
			ctx.arc(215,218,1,0,2*Math.PI,false);
			ctx.stroke();
			ctx.save();
			ctx.fillStyle="yellow";
			ctx.fill();
			ctx.restore();*/
		}
		
		function updateBonus(){
			//Actualiza los bonus
			for (bonus of bonuses){
				if(intersectRect(bonus.x,bonus.y,bonus.x+bonus.width,bonus.y+bonus.height,paddle.x,paddle.y,paddle.x+paddle.width,paddle.y+paddle.height)){
					aplicarBonus(bonus);
					var i = bonuses.indexOf(bonus);
					bonuses.splice(i,1);
				}else if(bonus.y>h){
					var i = bonuses.indexOf(bonus);
					bonuses.splice(i,1);
				}else{
					bonus.move();
					bonus.draw(ctx);
				}
			}
		}

		function timer(currentTime) {
			//Método auxiliar
			var aux = currentTime - oldTime;
			oldTime = currentTime;
			return aux;
		}

		var mainLoop = function(time) {
			//Loop Principal
			console.log(currentGameState);
			if(currentGameState=="gameRunning"){ 
				//Si la partida sigue en juego
				measureFPS(time);
				delta = timer(time);
				clearCanvas();

				if(finnivel==true){
					finnivel=false;
					if(nivel<10){
						nivel++;
						createBricks(nivel);
						
						for(ball of balls){
							balls.pop(ball);
						}
						
						var ball = new Ball(10,200,Math.PI/3,2,6,false);
						balls.push(ball);
						
						for(bonus of bonuses){
							bonuses.pop(bonus);
						}
						for(disparo of disparos){
							disparos.pop(disparo);
						}
						
						revertirBonus();
					}else{
						console.log("AQUI");
						currentGameState="gameEnded";
					}
				}
				
				if(paddle.dead==true){
					//Si la bola ha muerto se resta una vidas
					lifes=lifes-1;
					revertirBonus();
					if(lifes<=0){
						//Si no quedan vides termina el juego
						currentGameState = "gameOver";
					}else{
						//Si quedan vidas se saca otra bola y se eliminan los bonus y disparos de la partida anterior
						paddle.dead=false;
						var ball = new Ball(10,200,Math.PI/3,2,6,false);
						balls.push(ball);
						
						for(bonus of bonuses){
							bonuses.pop(bonus);
						}
						for(disparo of disparos){
							disparos.pop(disparo);
						}
					}
				}
				
				updatePaddlePosition();
				updateDisparos();
				testDisparos();
				updateBalls();
				updateBonus();
				drawBoundaries();
				drawVaus(paddle.x, paddle.y);
				drawBricks();
				displayScore(ctx);
				displayLifes(ctx);
				displayLevel(ctx);
				requestAnimationFrame(mainLoop);
			}else if(currentGameState=="gamePaused"){
				//Si la partida está pausada se escribe Pause en pantalla
				displayPause(ctx);
				requestAnimationFrame(mainLoop);
			}else if(currentGameState=="gameEnded"){
				//You win y el score
				console.log("displayWin");
				displayWin(ctx);
			}else{
				//Si la partida ha terminado, funde a negro y muestra Game Over
				ctx.fillStyle="black";
				ctx.fillRect(0,0,w,h);
				ctx.save();
				ctx.fillStyle="white";
				ctx.font="20px Verdana";
				ctx.fillText("Game Over", (w/2)-55,h/2);
				ctx.restore();
			}    
		};
		
		function init(){
			loadAssets(startNewGame);
		}
		
		function startNewGame(){
			var ball = new Ball(15,200,Math.PI/3,2,6,false);
			balls.push(ball);
			//var bonus = new Bonus('L', 200, 10);
			//bonus.setSprite();
			//bonuses.push(bonus);
			createBricks(1);
			music.play();
			requestAnimationFrame(mainLoop);
		}
		
		function loadAssets(callback){
			var load1 = false;
			var load2 = false;
			music = new Howl({
				urls: ['sounds/Game_Start.ogg'],
				volume: 1,
				onload: function(){
					load1=true;
					if(load2){
						callback();
					}
				}
			})
			
			sounds = new Howl({
				urls: ['sounds/sounds.mp3'],
				volume: 1,
				onload: function(){
					load2=true;
					if(load1){
						callback();
					}
				},
				sprite: {
					brick: [12500,700],
					paddle: [11200, 700],
					lose: [1000, 500],
					shoot: [15000, 800],
					bonus: [22000, 1800],
					brickshooted: [1000, 1500]
				}
			});
		}

		var start = function() {
			// adds a div for displaying the fps value
			fpsContainer = document.createElement('div');
			document.body.appendChild(fpsContainer);

			inicializarGestorTeclado();
			
			resources.load([
				'img/sprites.png'
			]);
			
			resources.onReady(init);
		};
	  
		return {
			start: start
		};
	};
	
	var game = new GF();
	game.start();
}

