const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());
let db = null;

const convertPlayerSnakeCaseToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchSnakeCaseToCamelCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchSnakeCaseToCamelCase = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//GET PLAYERS API1
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => {
      return convertPlayerSnakeCaseToCamelCase(eachPlayer);
    })
  );
});

//GET SPECIFIC PLAYER API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `
    SELECT * FROM player_details
    WHERE player_id =${playerId};`;

  const getPlayer = await db.get(getPlayerDetails);
  response.send(convertPlayerSnakeCaseToCamelCase(getPlayer));
});

//update details API3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDetailsQuery = `UPDATE 
    player_details
    SET
    player_name='${playerName}'

    WHERE player_id =${playerId}
    `;
  const player = await db.run(updateDetailsQuery);
  response.send("Player Details Updated");
});

//GET A SPECIFIC MATCH API4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchesQuery = `SELECT * FROM match_details
    WHERE match_id = ${matchId};`;

  const matchDetails = await db.get(getMatchesQuery);
  response.send(convertMatchSnakeCaseToCamelCase(matchDetails));
});

//GET MATCHES OF A PLAYER API5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getMatchesOfPlayerQuery = `SELECT * FROM 
    player_match_score NATURAL JOIN match_details 
    WHERE player_id = ${playerId} ;`;

  const matches = await db.all(getMatchesOfPlayerQuery);
  response.send(
    matches.map((eachMatch) => convertMatchSnakeCaseToCamelCase(eachMatch))
  );
});

//GET PLAYERS FROM A SPECIFIC MATCH API6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getplayersOfMatchQuery = `
    SELECT * FROM player_match_score NATURAL JOIN player_details
    WHERE match_id =${matchId};`;

  const getPlayers = await db.all(getplayersOfMatchQuery);
  response.send(
    getPlayers.map((eachPlayer) =>
      convertPlayerSnakeCaseToCamelCase(eachPlayer)
    )
  );
});

//getplayers api7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const getScores = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score 
    NATURAL JOIN player_details
    WHERE player_id =${playerId} `;
  const Players = await db.get(getScores);
  response.send(Players);
});
module.exports = app;
