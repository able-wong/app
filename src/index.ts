import express from 'express';
import { AppDataSource } from './appDataSource';
import { authenticateJWT } from './middleware/authenticateJWT';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './controllers/customerController';
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from './controllers/locationController';
import {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from './controllers/scheduleController';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from './controllers/serviceController';
import {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from './controllers/teamMemberController';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from './controllers/userController';

export const app = express();
const port = 3000;

// Add middleware to parse JSON request bodies
app.use(express.json());

// Function to set up all routes
const setupRoutes = () => {
  app.get('/api/customers', authenticateJWT, getCustomers);
  app.get('/api/customers/:id', authenticateJWT, getCustomer);
  app.post('/api/customers', authenticateJWT, createCustomer);
  app.put('/api/customers/:id', authenticateJWT, updateCustomer);
  app.delete('/api/customers/:id', authenticateJWT, deleteCustomer);

  app.get(
    '/api/customers/:customerId/locations',
    authenticateJWT,
    getLocations,
  );
  app.get(
    '/api/customers/:customerId/locations/:id',
    authenticateJWT,
    getLocation,
  );
  app.post(
    '/api/customers/:customerId/locations',
    authenticateJWT,
    createLocation,
  );
  app.put(
    '/api/customers/:customerId/locations/:id',
    authenticateJWT,
    updateLocation,
  );
  app.delete(
    '/api/customers/:customerId/locations/:id',
    authenticateJWT,
    deleteLocation,
  );

  app.get(
    '/api/customers/:customerId/locations/:locationId/schedules',
    authenticateJWT,
    getSchedules,
  );
  app.get(
    '/api/customers/:customerId/locations/:locationId/schedules/:id',
    authenticateJWT,
    getSchedule,
  );
  app.post(
    '/api/customers/:customerId/locations/:locationId/schedules',
    authenticateJWT,
    createSchedule,
  );
  app.put(
    '/api/customers/:customerId/locations/:locationId/schedules/:id',
    authenticateJWT,
    updateSchedule,
  );
  app.delete(
    '/api/customers/:customerId/locations/:locationId/schedules/:id',
    authenticateJWT,
    deleteSchedule,
  );

  app.get(
    '/api/customers/:customerId/locations/:locationId/services',
    authenticateJWT,
    getServices,
  );
  app.get(
    '/api/customers/:customerId/locations/:locationId/services/:id',
    authenticateJWT,
    getService,
  );
  app.post(
    '/api/customers/:customerId/locations/:locationId/services',
    authenticateJWT,
    createService,
  );
  app.put(
    '/api/customers/:customerId/locations/:locationId/services/:id',
    authenticateJWT,
    updateService,
  );
  app.delete(
    '/api/customers/:customerId/locations/:locationId/services/:id',
    authenticateJWT,
    deleteService,
  );

  app.get(
    '/api/customers/:customerId/locations/:locationId/team-members',
    authenticateJWT,
    getTeamMembers,
  );
  app.get(
    '/api/customers/:customerId/locations/:locationId/team-members/:id',
    authenticateJWT,
    getTeamMember,
  );
  app.post(
    '/api/customers/:customerId/locations/:locationId/team-members',
    authenticateJWT,
    createTeamMember,
  );
  app.put(
    '/api/customers/:customerId/locations/:locationId/team-members/:id',
    authenticateJWT,
    updateTeamMember,
  );
  app.delete(
    '/api/customers/:customerId/locations/:locationId/team-members/:id',
    authenticateJWT,
    deleteTeamMember,
  );

  app.get('/api/customers/:customerId/users', authenticateJWT, getUsers);
  app.get('/api/customers/:customerId/users/:id', authenticateJWT, getUser);
  app.post('/api/customers/:customerId/users', authenticateJWT, createUser);
  app.put('/api/customers/:customerId/users/:id', authenticateJWT, updateUser);
  app.delete(
    '/api/customers/:customerId/users/:id',
    authenticateJWT,
    deleteUser,
  );

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });
};

// Function to start the server
export const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

// Only initialize database and start server if this file is being run directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => {
      console.log('Database connection initialized');
      setupRoutes();
      startServer();
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('Received SIGINT. Closing database connection...');
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('Database connection closed');
        }
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('Received SIGTERM. Closing database connection...');
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('Database connection closed');
        }
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('Error initializing database connection:', error);
    });
} else {
  // When imported as a module (e.g., in tests), just set up routes
  setupRoutes();
}
