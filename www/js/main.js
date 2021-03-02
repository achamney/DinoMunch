
document.addEventListener('deviceready', onDeviceReady, false);
let yum, munch;
let leaves = [];
let gameState = "eat";
let herbivores = ["brontosaurus", "triceratops", "parasaurolophus", "stegosaurus"],
    carnivores = [],
    omnivores = [];
let curDino = "brontosaurus";
let moveInterval = 30;
let dino,
    mates = [],
    eggs = [];
let bg;
function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    bg = new sound("audio/bg.mp3", true);
    yum = new sound("audio/yum.mp3", false);
    munch = new sound("audio/munch.mp3", false);
    dino = $("#dino");
    document.getElementById('playbutton').onclick = function () {
        bg.play();
        $('#titlescreen').hide();
        $('#levelselect').show();
    };
    // Adds pause event
    document.addEventListener("pause", manageAppPause);

    // Adds resume event
    document.addEventListener("resume", manageAppResume);
    window.screen.orientation.lock('landscape');
}
function manageAppPause() {
    bg.stop();
}
function manageAppResume() {
    bg.play();
}
function backtotitle() {
    $('#titlescreen').show();
    $('#levelselect').hide();
    $('#game').hide();
}
function play(dinoType) {
    $('#levelselect').hide();
    var gamebody = $('#game');
    leaves = [];
    gamebody.show();
    dino.draggabilly();
    gameState = "Eat";
    setGameStates();
}
function setGameStates() {
    dino.css("background-image", "url('img/" + curDino + ".png')");
    dino.css("left", "50px");
    dino.css("top", "45%");
    dino.moveState = "";
    var gameBody = $('#game');
    window["set" + gameState](gameBody);
}
function setEat(gameBody) {
    dino.on("dragMove", function () {
        for (var i = leaves.length - 1; i >= 0; i--) {
            var leaf = leaves[i];
            if (collides(dino, leaf)) {
                eatLeaf(dino, leaf, i);
            }
        }
    });
    var leafnum = Math.random() * 6 + 1;
    var totalWidth = gameBody.width();
    var totalHeight = gameBody.height();
    for (var i = 0; i < leafnum; i++) {
        var positionx = Math.random() * (totalWidth - 40);
        var positiony = Math.random() * (totalHeight - 40);
        var leaf = $("<div class='leaf'></div>")
            .css("left", positionx + "px")
            .css("top", positiony + "px")
            .appendTo(gameBody);
        leaves.push(leaf);
    }

    var intervalNum = window.setInterval(function () {
        if (dino.moveState == "move") {
            var dinoLeft = parseInt(dino.css("left"));
            dino.css("left", dinoLeft + 5);
            if (dinoLeft > gameBody.width()) {
                gameState = "FindMate";
                window.clearInterval(intervalNum);
                setGameStates();
            }
        }
    }, moveInterval);
}
function setFindMate(gameBody) {
    var otherDinos = herbivores.filter(d => d != curDino),
        lRnd = () => Math.random() * (gameBody.width() / 2 - 200) + gameBody.width() / 2,
        tRnd = () => Math.random() * (gameBody.height() - 200);

    for (var d of otherDinos) {
        var mate = makeDino(gameBody, lRnd(), tRnd(), d)
            .addClass("mate");
        moveToNotOverlap(mate, mates, lRnd, tRnd);
        mates.push(mate);
    }
    var correctMate = makeDino(gameBody, lRnd(), tRnd(), curDino)
        .addClass("mate");
    moveToNotOverlap(correctMate, mates, lRnd, tRnd);
    dino.on("dragMove", function () {
        if (collides(dino, correctMate)) {
            yum.play();
            dino.moveState = "move";
            correctMate.moveState = "move";
        }
    });

    var intervalNum = window.setInterval(function () {
        if (dino.moveState == "move") {
            var dinoLeft = parseInt(dino.css("left"));
            dino.css("left", dinoLeft + 5);
            var mateLeft = parseInt(correctMate.css("left"));
            correctMate.css("left", mateLeft + 5);
            if (dinoLeft > gameBody.width()) {
                gameState = "LayEgg";
                for (var mate of mates) {
                    mate.remove();
                }
                mates = [];
                window.clearInterval(intervalNum);
                setGameStates();
            }
        }
    }, moveInterval);
}
function setLayEgg(gameBody) {
    var lRnd = () => Math.random() * (gameBody.width() / 2 - 200) + gameBody.width() / 2,
        tRnd = () => Math.random() * (gameBody.height() - 200),
        eggNum = 3;

    for (var i = 0; i < eggNum; i++) {
        var egg = makeEgg(gameBody, lRnd(), tRnd(), "egg")
            .addClass("transparent");
        moveToNotOverlap(egg, eggs, lRnd, tRnd);
        eggs.push(egg);
    }
    dino.on("dragMove", function () {

        for (var i = 0; i < eggs.length; i++) {
            var curEgg = eggs[i];
            if (collides(dino, curEgg) && !curEgg.added) {
                yum.play();
                curEgg.added = true;
                curEgg.removeClass("transparent");
                var allEggsAdded = eggs.map(e => e.added).reduce((a, b) => a & b);
                if (allEggsAdded) {
                    dino.moveState = "move";
                }
            }
        }
    });

    var intervalNum = window.setInterval(function () {
        if (dino.moveState == "move") {
            var dinoLeft = parseInt(dino.css("left"));
            dino.css("left", dinoLeft + 5);
            if (dinoLeft > gameBody.width()) {
                gameState = "Hatch";
                for (var egg of eggs) {
                    egg.remove();
                }
                eggs = [];
                window.clearInterval(intervalNum);
                setGameStates();
            }
        }
    }, moveInterval);
}
function setHatch(gameBody) {
    var lRnd = () => Math.random() * (gameBody.width() / 2 - 200) + gameBody.width() / 2,
        tRnd = () => Math.random() * (gameBody.height() - 200);

    var egg = makeEgg(gameBody, lRnd(), tRnd(), "egg")
        .width("200px").height("300px").css("left", "40%").css("top", "35%");

    dino.css("left", "-100px");
    var mult = 1;
    egg.on("click", () => {
        yum.play();
        mult += 0.1;
        egg.css("transform", `scale(${mult})`);
        if (mult >= 1.6) {
            var rndDno = Math.floor(Math.random() * herbivores.length);
            curDino = herbivores[rndDno];
            dino.css("background-image", "url('img/" + curDino + ".png')")
                .css("left", "42%").css("top", "35%");
            egg.css("background-image", "url('img/egghatch.png')").css("z-index", "1").removeClass("interactable");
            egg.off("click");
            window.setTimeout(() => {
                gameState = "Eat";
                egg.remove();
                setGameStates();
            }, 3000);
        }
    });
}
function moveToNotOverlap(obj, objs, lRnd, tRnd) {
    for (var i = 0; i < 100 && objs.length > 0; i++) {
        if (collidesArray(obj, objs)) {
            obj.css("left", lRnd())
                .css("top", tRnd());
        } else {
            break;
        }
    }
}
function makeDino(container, left, top, filename) {
    return $("<div class='dino interactable'></div>")
        .css("left", left)
        .css("top", top)
        .css("background-image", "url('img/" + filename + ".png')")
        .appendTo(container);
}
function makeEgg(container, left, top, filename) {
    return $("<div class='egg interactable'></div>")
        .css("left", left)
        .css("top", top)
        .css("background-image", "url('img/" + filename + ".png')")
        .appendTo(container);
}
function eatLeaf(dino, leaf, i) {
    leaf.remove()
    leaves.splice(i, 1);
    if (Math.random() > 0.5)
        yum.play();
    else
        munch.play();
    if (leaves.length == 0) {
        //dino.disable() // disable dragging
        dino.moveState = "move";
    }
}
function collides(obj1, obj2) {
    var w1 = obj1.width(), w2 = obj2.width(),
        x1 = obj1.position().left, x2 = obj2.position().left;
    if (x1 < x2 + w2 && x1 + w1 > x2) {
        var h1 = obj1.height(), h2 = obj2.height(),
            y1 = obj1.position().top, y2 = obj2.position().top;
        if (y1 < y2 + h2 && y1 + h1 > y2)
            return true;
    }
    return false;
}
function collidesArray(obj, objArray) {
    return objArray
        .map(m => collides(m, obj))
        .reduce((prev, cur) => prev ? prev : cur);
}
function sound(src, loop) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.loop = loop;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    }
    this.stop = function () {
        this.sound.pause();
    }
}
