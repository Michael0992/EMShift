let mouseX = 0;
let mouseY = 0;

const imgs = ["knight.png", "hero.png","goblins.png","ambush.png","beggar.png","caravels.png","cavalry.png","support.png"];
const titles = ["Gefallener Ritter", "Unerschrockener Held", "Goblin Armee", "Hinterhalt", "Schlechte Zeiten", "Reichtum", "Kavallerie", "Unterstützung"];
const texts = [
    "Ein gefallener Ritter aus den Schattenkriegen des Hochmittelalters, dessen Seele durch endlose Schlachten verhärtet wurde und dessen Klinge unzählige Feinde niedergestreckt hat.",
    "Ein unerschrockener Held, der sich den Mächten der Dunkelheit entgegenstellt und das Schicksal der Welt in seinen Händen hält.",
    "Eine Goblin Armee, die aus den Tiefen der Wälder aufsteigt, um Chaos und Zerstörung zu verbreiten.",
    "Ein hinterhältiger Hinterhalt, der die Feinde überrascht und ihnen den Boden unter den Füßen wegzieht.",
    "Schlechte Zeiten, in denen die Welt von Dunkelheit und Verzweiflung beherrscht wird, und nur die Mutigsten überleben können.",
    "Reichtum, der aus den Schätzen der alten Königreiche stammt und unermesslichen Wert besitzt.",
    "Kavallerie, die mit unbändiger Kraft und Geschwindigkeit über das Schlachtfeld stürmt und ihre Feinde in Angst und Schrecken versetzt.",
    "Unterstützung, die den Helden in ihrem Kampf gegen das Böse zur Seite steht und ihnen den entscheidenden Vorteil verschafft."
];
const html_karte = ' <div class="spielkarte" onclick="flip(this)"><div class="front"><span class="kartenTitel"></span><div class="kartenStatus"><div><img src="./imgs/dmg.png"/ alt="attack points"><span>500</span></div><div><img src="./imgs/deff.png"/ alt="def points"><span>1000</span></div></div><img alt="Bild der Spielkarte"/><p></p></div><div class="back"></div></div>'
const standatdKarte = '<div class="pseudokarte"></div>'
let round = "player";
const card_ids = [];
const hand = {
    1:{
        card: null,
        posx: "25vw",
        posy: "-10px",
        rot: "-15deg"
    },
    2:{
        card: null,
        posx: "35vw",
        posy: "10px",
        rot: "-5deg"
    },
    3:{
        card: null,
        posx: "45vw",
        posy: "10px",
        rot: "10deg"
    },
    4:{
        card: null,
        posx: "55vw",
        posy: "-5px",
        rot: "20deg"
    },
    5:{
        card: null,
        posx: "65vw",
        posy: "-10px",
        rot: "25deg"
    }
}
const opponent_hand = {
    1:{
        card: null,
        posx: "25vw",
        posy: "-15px",
        rot: "15deg"
    },
    2:{
        card: null,
        posx: "30vw",
        posy: "-10px",
        rot: "5deg"
    },
    3:{
        card: null,
        posx: "35vw",
        posy: "10px",
        rot: "-10deg"
    },
    4:{
        card: null,
        posx: "40vw",
        posy: "-15px",
        rot: "-20deg"
    },
    5:{
        card: null,
        posx: "45vw",
        posy: "-20px",
        rot: "-25deg"
    }
}
let roundCounter = 0;
let timer = 60;
load_opponent();
clock();
player_card_counter = 0;
opponent_card_counter = 0;



// const karte = document.getElementById("karte001")
// const titel = karte.getElementsByTagName("div")[0].getElementsByTagName("span")[0];
// const bild = karte.getElementsByTagName("div")[0].getElementsByTagName("img")[0];
// const text = karte.getElementsByTagName("div")[0].getElementsByTagName("p")[0];
//document.getElementById("karte001").classList.add("flipFrontStep2");

const stapel = document.getElementsByClassName("pseudokarte");

for(let i = 0; i < stapel.length; i++){
    stapel[i].style.transform = "rotate(" + (Math.random() * 20 - 10) + "deg)";
}

function flip(card){
    if (card.classList.contains("flipFrontStep2")) {
        card.classList.remove("flipFrontStep2");
        card.classList.add("flipBackStep1");
    }
    else if (card.classList.contains("flipBackStep2")) {
        card.classList.remove("flipBackStep2");
        card.classList.add("flipFrontStep1");
    }

    setTimeout(function() {
        if (card.classList.contains("flipFrontStep1")) {
            card.getElementsByClassName("front")[0].style.display = "flex";
            card.classList.remove("flipFrontStep1");
            card.classList.add("flipFrontStep2");
        }
        else if (card.classList.contains("flipBackStep1")) {
            card.getElementsByClassName("front")[0].style.display = "none";
            card.classList.remove("flipBackStep1");
            card.classList.add("flipBackStep2");
            
        }
    }, 200);
}

function randomCard(karte){
    titel = karte.getElementsByTagName("div")[0].getElementsByTagName("span")[0];
    bild = karte.getElementsByTagName("div")[0].getElementsByTagName("img")[0];
    text = karte.getElementsByTagName("div")[0].getElementsByTagName("p")[0];

    let counter = Math.floor(Math.random() * imgs.length);
    const maxCounter = imgs.length;
    counter = counter + 1
    if(counter >= maxCounter){
        counter = 0;
    }

    titel.textContent = titles[counter];
    bild.src = "./imgs/" + imgs[counter];
    text.textContent = texts[counter];
}

function addPlayerCards(){
    if(player_card_counter >= 5){
        return;
    }
    if(round == "player"){
        if(roundCounter == 0 && player_card_counter == 0){
            for(let i = 0; i < 3; i++){
                addPlayerCard();
                player_card_counter = 3;
            }
        }
        else{
            addPlayerCard();
            player_card_counter += 1;
        }

    } 
}

function addPlayerCard(){
    // HTML-String in ein Element umwandeln
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html_karte;
        const new_karte = tempDiv.firstChild;
        let new_random_id = "karte" + Math.floor(Math.random() * 1000000);
        while(card_ids.includes(new_random_id)){
            new_random_id = "karte" + Math.floor(Math.random() * 1000000);
        }
        new_karte.id = new_random_id;
        new_karte.classList.add("on_hand")
        card_ids.push(new_random_id);
        document.getElementsByTagName("body")[0].appendChild(new_karte);
        
        const handcards = document.getElementsByClassName("on_hand");
        for(let i = 0; i < handcards.length; i++){
            randomCard(handcards[handcards.length - 1]);
            hand[i+1].card = handcards[i];
            handcards[i].style.left = hand[i+1].posx;
            handcards[i].style.bottom = hand[i+1].posy;
            handcards[i].style.transform = "rotate(" + hand[i+1].rot + ")";
        }
}

function clock(){
    const gameinfo = document.getElementById("gameinfo");
    const runde = gameinfo.getElementsByTagName("span")[0]
    const currentPlayer = gameinfo.getElementsByTagName("span")[1]
    
    setInterval(function() {
        timer--;
        if(timer < 0){
           timer = 60;
           if(round == "player"){
            round = "opponent";
            addOpponentCards();
            runde.textContent = parseInt(runde.textContent) +1;
            roundCounter += 1;
           }
           else{
            round = "player";
           }
           
            currentPlayer.textContent = round;
        }
        if(timer <= 10){
            document.getElementById("timer").style.color = "red";
        }
        else{
            document.getElementById("timer").style.color = "black";
        }
        document.getElementById("timer").textContent = timer;
        
    }, 1000);
}
function addOpponentCards(){
    if(opponent_card_counter >= 5){
        return;
    }
    if(roundCounter == 0 && opponent_card_counter == 0){
        for(let i = 0; i < 3; i++){
            addOpponentCard();
            opponent_card_counter = 3;
        }
        
    }
    else{
        addOpponentCard();
        opponent_card_counter += 1;
    }

}

function addOpponentCard(){
            // HTML-String in ein Element umwandeln
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = standatdKarte;
        const new_karte = tempDiv.firstChild;
        let new_random_id = "karte" + Math.floor(Math.random() * 1000000);
        while(card_ids.includes(new_random_id)){
            new_random_id = "karte" + Math.floor(Math.random() * 1000000);
        }
        new_karte.id = new_random_id;
        new_karte.classList.add("on_opponent_hand")
        card_ids.push(new_random_id);
        document.getElementsByTagName("body")[0].appendChild(new_karte);

        const handcards = document.getElementsByClassName("on_opponent_hand");
        for(let i = 0; i < handcards.length; i++){
            opponent_hand[i+1].card = handcards[i];
            handcards[i].style.left = opponent_hand[i+1].posx;
            handcards[i].style.top = opponent_hand[i+1].posy;
            handcards[i].style.transform = "rotate(" + opponent_hand[i+1].rot + ")";
        }

}

async function load_opponent(){
    const response = await fetch("/opponent");
    const data = await response.json();
    const opponent_name = data.name;
    const opponent_image = data.image;


    const opponent_profile = document.getElementById("opponent");
    const img = document.createElement("img");
    img.src = opponent_image;
    opponent_profile.appendChild(img);
    const name = document.createElement("div");
    name.textContent = opponent_name;
    opponent_profile.appendChild(name);
    img.setAttribute("alt", "Profilbild des Gegners");
    img.setAttribute("id", "opponent_img");
    name.setAttribute("id", "opponent_name");
}