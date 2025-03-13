# API Documentation

## Customers

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get a specific customer by ID
- `POST /api/customers` - Create a new customer
  ```json
  {
    "name": "Customer Name"
  }
  ```
- `PUT /api/customers/:id` - Update a customer by ID
  ```json
  {
    "name": "Updated Customer Name"
  }
  ```
- `DELETE /api/customers/:id` - Delete a customer by ID

## Locations

- `GET /api/customers/:customerId/locations` - Get all locations for a customer
- `GET /api/customers/:customerId/locations/:id` - Get a specific location by ID
- `POST /api/customers/:customerId/locations` - Create a new location for a customer
  ```json
  {
    "name": "Location Name",
    "address": "Location Address"
  }
  ```
- `PUT /api/customers/:customerId/locations/:id` - Update a location by ID
  ```json
  {
    "name": "Updated Location Name",
    "address": "Updated Location Address"
  }
  ```
- `DELETE /api/customers/:customerId/locations/:id` - Delete a location by ID

## Schedules

- `GET /api/customers/:customerId/locations/:locationId/schedules` - Get all schedules for a location
- `GET /api/customers/:customerId/locations/:locationId/schedules/:id` - Get a specific schedule by ID
- `POST /api/customers/:customerId/locations/:locationId/schedules` - Create a new schedule for a location
  ```json
  {
    "date": "2023-10-01",
    "time_period": "09:00-11:00",
    "serviceId": 1,
    "userId": 1,
    "teamMemberId": 1
  }
  ```
- `PUT /api/customers/:customerId/locations/:locationId/schedules/:id` - Update a schedule by ID
  ```json
  {
    "date": "2023-10-02",
    "time_period": "10:00-12:00",
    "serviceId": 1,
    "userId": 1,
    "teamMemberId": 1
  }
  ```
- `DELETE /api/customers/:customerId/locations/:locationId/schedules/:id` - Delete a schedule by ID

## Services

- `GET /api/customers/:customerId/locations/:locationId/services` - Get all services for a location
- `GET /api/customers/:customerId/locations/:locationId/services/:id` - Get a specific service by ID
- `POST /api/customers/:customerId/locations/:locationId/services` - Create a new service for a location
  ```json
  {
    "name": "Service Name"
  }
  ```
- `PUT /api/customers/:customerId/locations/:locationId/services/:id` - Update a service by ID
  ```json
  {
    "name": "Updated Service Name"
  }
  ```
- `DELETE /api/customers/:customerId/locations/:locationId/services/:id` - Delete a service by ID

## Team Members

- `GET /api/customers/:customerId/locations/:locationId/team-members` - Get all team members for a location
- `GET /api/customers/:customerId/locations/:locationId/team-members/:id` - Get a specific team member by ID
- `POST /api/customers/:customerId/locations/:locationId/team-members` - Create a new team member for a location
  ```json
  {
    "name": "Team Member Name"
  }
  ```
- `PUT /api/customers/:customerId/locations/:locationId/team-members/:id` - Update a team member by ID
  ```json
  {
    "name": "Updated Team Member Name"
  }
  ```
- `DELETE /api/customers/:customerId/locations/:locationId/team-members/:id` - Delete a team member by ID

## Users

- `GET /api/customers/:customerId/users` - Get all users for a customer
- `GET /api/customers/:customerId/users/:id` - Get a specific user by ID
- `POST /api/customers/:customerId/users` - Create a new user for a customer
  ```json
  {
    "firstName": "First Name",
    "lastName": "Last Name",
    "age": 30
  }
  ```
- `PUT /api/customers/:customerId/users/:id` - Update a user by ID
  ```json
  {
    "firstName": "Updated First Name",
    "lastName": "Updated Last Name",
    "age": 31
  }
  ```
- `DELETE /api/customers/:customerId/users/:id` - Delete a user by ID

## Miscellaneous

- `GET /` - Welcome route
