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
templates = Jinja2Templates(directory="templates")
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")



@app.get("/home", response_class=HTMLResponse)
async def read_item(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

app.mount('/', socketapp)

@sio.event
async def connect(sid, environ, auth=None):
    print('ATTEMPT CONNECTION')

@sio.event
async def sendMessage(sid, data):
    await sio.emit('receiveMessage', data)

