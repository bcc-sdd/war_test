from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import socketio
import json

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


@app.get("/preview", response_class=HTMLResponse)
async def preview(request: Request):
    return templates.TemplateResponse("view.html", {"request": request})

@app.get("/geojson")
async def geojson():
    with open("boundary_lines.geojson", "r") as file1:
        file1 = json.load(file1)
        return JSONResponse(content=file1)
    

@app.get("/geojson_coastline")
async def geojson_coastline():
    with open("coastlines.geojson", "r") as file1:
        file1 = json.load(file1)
        return JSONResponse(content=file1)    

@app.get("/inputMap", response_class=HTMLResponse)
async def input_map(request: Request):
    return templates.TemplateResponse("inputMap.html", {"request": request})


@app.get("/overview", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("overview.html", {"request": request})




@app.get("/obj_blue", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("objYellow.html", {"request": request})




@app.get("/home", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    return templates.TemplateResponse("adminPanel.html", {"request": request})

app.mount('/', socketapp)

@sio.event
async def connect(sid, environ, auth=None):
    print('connected', sid)
    print(auth)




@sio.event
async def sendMessage(sid, data):
    if global_data["general_sid"] == sid:
        ...
    else:
        session = await sio.get_session(sid)
        await sio.emit('receiveMessage', data, room=session["team"])

@sio.event
async def setTeam(sid, team: int):
    team = int(team)
    if team == 0:
        global_data["general_sid"] = sid
    else:
        team_name = f'team{team}'
        print(team_name)
        sio.enter_room(sid, team_name)
        sio.enter_room(global_data["general_sid"], team_name)
        await sio.save_session(sid, {'team': team_name})
    

@sio.event
async def commitAction(sid, data):
    await sio.emit('broadcastAction', data)


@sio.event
async def result(sid, data):
    await sio.emit('continueAction', data)


# OBJECTIVES


@sio.event
async def objectiveUpdate(sid, data):
    print(data)
    await sio.emit('objectiveUpdate_overall', data, room=global_data["objective_display"])


# IDENTITIES

@sio.event
async def setDisplay(sid):
    global_data["objective_display"] = sid



@sio.event
async def setAdmin(sid):
    global_data["general_sid"] = sid
