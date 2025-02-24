import express from 'express';
import { AppDataSource } from './appDataSource';
import { User } from './entity/User';
import { authenticateJWT } from './middleware/authenticateJWT';

const app = express();
const port = 3000;

AppDataSource.initialize()
  .then(() => {
    const userRepository = AppDataSource.getRepository(User);

    app.get('/api/users.json', authenticateJWT, async (req, res) => {
      const users = await userRepository.find();
      res.json(users);
    });

    app.get('/', (req, res) => {
      res.send('Hello, world!');
    });

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port} updated`);
    });
  })
  .catch((error) => console.log(error));
