import { Injectable } from "@nestjs/common";

@Injectable()
export class MaintenanceService {
  private on = false;
  enable() {
    this.on = true;
  }
  disable() {
    this.on = false;
  }
  get active() {
    return this.on;
  }
}
