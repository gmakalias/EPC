import { Controller, Get } from '@nestjs/common';

@Controller() 
export class AppController {
  @Get() // This matches: http://localhost:3000/api/v1
  getHealth() {
    return { status: 'ok', message: 'EPC API is running' };
  }

  @Get('test') // This matches: http://localhost:3000/api/v1/test
  getTest() {
    return "Test successful";
  }
}