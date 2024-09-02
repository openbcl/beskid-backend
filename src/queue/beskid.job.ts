import { randomUUID, UUID } from "crypto";
import { Model } from "../model/model";
import { Task } from "../task/task";

export class BeskidJob {
  id: UUID = randomUUID();
  constructor (public task: Task, public model: Model) {}
}