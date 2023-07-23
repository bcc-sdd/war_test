
export default class Path {
    constructor(
      polyline,
      done,
      flightTime,
      startTime,
      distance,
      endTime,
      start,
      end
    ) {
      this.polyline = polyline;
      this.done = false;
      this.flightTime = flightTime;
      this.startTime = startTime;
      this.distance = distance;
      this.endTime = endTime;
      this.start = start;
      this.end = end;
      this.id = null;
      this.paused_time = null;
    }
  
    startFlight() {
      var startTime = Date.now() / 1000;
      this.startTime = startTime;
      this.endTime = startTime + this.flightTime;
    }
  }