import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {
  add(values: any) {
    console.log(values);
  }

  upload(values: any) {
    console.log(values);
  }
}
