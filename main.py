from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import socketio

sio = socketio.AsyncServer(
    async_mode='asgi',
    # cors_allowed_origins = []
)
socketapp = socketio.ASGIApp(sio)
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
global_data = {
    "available_teams": 0,
    "general_sid": None,
    "teams": []
}


@app.get("/home", response_class=HTMLResponse)
async def read_item(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

app.mount('/', socketapp)

@sio.event
async def connect(sid, environ, auth=None):
    available_teams = global_data["available_teams"]
    if available_teams == 0:
        global_data["general_sid"] = sid
    else:
        team_name = f'team{available_teams}'
        global_data["teams"].append(team_name)
        sio.enter_room(sid, team_name)
        sio.enter_room(global_data["general_sid"], team_name)
        await sio.save_session(sid, {'team': team_name})
    data = {"teamNumber": global_data["available_teams"]}
    await sio.emit('sendTeam', data, room=sid)
    global_data["available_teams"] += 1

@sio.event
async def sendMessage(sid, data):
    session = await sio.get_session(sid)
    await sio.emit('receiveMessage', data, room=session["team"])

