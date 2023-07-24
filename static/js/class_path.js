export default class Path {
  constructor(
    polyline,
    start,
    end
  ) {
    this.polyline = polyline;
    this.start = start;
    this.end = end;
    this.done = false;
    this.flightTime = null;
    this.startTime = null;
    this.distance = null;
    this.endTime = null;
    this.id = null;
    this.paused_time = null;

  }

  startFlight(startTime) {
    this.endTime = startTime + this.flightTime;
  }

  getProgress() {
    var currentTime = Date.now() / 1000;
    let progress = 1 - (this.endTime - currentTime) / this.flightTime;
    return progress
  }
}

