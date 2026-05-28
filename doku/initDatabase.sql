-- =============================================
-- Datenbank erstellen
-- =============================================
CREATE DATABASE IF NOT EXISTS CardGame;
USE CardGame;

-- =============================================
-- Tabellen erstellen
-- =============================================

CREATE TABLE User (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
);

CREATE TABLE Scoreboard (
    User_ID INT PRIMARY KEY,
    Punkte INT DEFAULT 0,
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

CREATE TABLE Game_Cards (
    Card_ID INT PRIMARY KEY AUTO_INCREMENT,
    Card_Path VARCHAR(255) NOT NULL
);

CREATE TABLE PlayerRoom (
    Room_ID INT PRIMARY KEY AUTO_INCREMENT,
    User_ID_1 INT NOT NULL,
    User_ID_2 INT NOT NULL,
    Create_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID_1) REFERENCES User(User_ID),
    FOREIGN KEY (User_ID_2) REFERENCES User(User_ID)
);

CREATE TABLE GameSession (
    Room_ID INT PRIMARY KEY,
    Activ_Player INT,
    Round INT DEFAULT 1,
    Round_Time INT DEFAULT 60,
    FOREIGN KEY (Room_ID) REFERENCES PlayerRoom(Room_ID),
    FOREIGN KEY (Activ_Player) REFERENCES User(User_ID)
);

CREATE TABLE Playfield (
    Room_ID INT NOT NULL,
    User_ID INT NOT NULL,
    Card_ID INT NOT NULL,
    Place INT NOT NULL,
    Card_stance VARCHAR(50),
    PRIMARY KEY (Room_ID, User_ID, Place),
    FOREIGN KEY (Room_ID) REFERENCES GameSession(Room_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Card_ID) REFERENCES Game_Cards(Card_ID)
);

CREATE TABLE Player_stats (
    Room_ID INT NOT NULL,
    User_ID INT NOT NULL,
    LP INT DEFAULT 8000,
    Points INT DEFAULT 0,
    PRIMARY KEY (Room_ID, User_ID),
    FOREIGN KEY (Room_ID) REFERENCES PlayerRoom(Room_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

CREATE TABLE Hand (
    Room_ID INT NOT NULL,
    User_ID INT NOT NULL,
    Card_ID INT NOT NULL,
    Place INT NOT NULL,
    PRIMARY KEY (Room_ID, User_ID, Place),
    FOREIGN KEY (Room_ID) REFERENCES GameSession(Room_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Card_ID) REFERENCES Game_Cards(Card_ID)
);