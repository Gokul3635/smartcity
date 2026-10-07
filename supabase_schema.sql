-- Smart City Management System - Supabase Schema & Seeding Script

-- 1. CLEANUP (Optional - drops existing tables in case of rebuilds)
DROP TABLE IF EXISTS "emergencyContacts" CASCADE;
DROP TABLE IF EXISTS emergencies CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS "busRoutes" CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS "utilityBills" CASCADE;
DROP TABLE IF EXISTS accidents CASCADE;
DROP TABLE IF EXISTS "trafficUpdates" CASCADE;
DROP TABLE IF EXISTS "wasteVehicles" CASCADE;
DROP TABLE IF EXISTS "wasteSchedules" CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLES WITH EXACT FIELD CASINGS

-- Users Table
CREATE TABLE "users" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'citizen',
  "phone" VARCHAR(50) DEFAULT '',
  "googleId" VARCHAR(255),
  "picture" VARCHAR(255)
);

-- Complaints Table
CREATE TABLE "complaints" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) REFERENCES "users"("id") ON DELETE SET NULL,
  "type" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "location" VARCHAR(255),
  "status" VARCHAR(50) DEFAULT 'pending',
  "assignedTo" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements Table
CREATE TABLE "announcements" (
  "id" VARCHAR(255) PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workers Table
CREATE TABLE "workers" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "department" VARCHAR(100) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'available',
  "currentTask" VARCHAR(255)
);

-- Waste Schedules Table
CREATE TABLE "wasteSchedules" (
  "id" VARCHAR(255) PRIMARY KEY,
  "area" VARCHAR(255) NOT NULL,
  "day" VARCHAR(100) NOT NULL,
  "time" VARCHAR(100) NOT NULL,
  "vehicleId" VARCHAR(255)
);

-- Waste Vehicles Table
CREATE TABLE "wasteVehicles" (
  "id" VARCHAR(255) PRIMARY KEY,
  "driver" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "location" VARCHAR(255),
  "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Traffic Updates Table
CREATE TABLE "trafficUpdates" (
  "id" VARCHAR(255) PRIMARY KEY,
  "location" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accidents Table
CREATE TABLE "accidents" (
  "id" VARCHAR(255) PRIMARY KEY,
  "location" VARCHAR(255) NOT NULL,
  "severity" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'active',
  "reportedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Utility Bills Table
CREATE TABLE "utilityBills" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) REFERENCES "users"("id") ON DELETE SET NULL,
  "type" VARCHAR(100) NOT NULL,
  "amount" NUMERIC NOT NULL,
  "dueDate" DATE NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "usage" VARCHAR(100),
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- Buses Table
CREATE TABLE "buses" (
  "id" VARCHAR(255) PRIMARY KEY,
  "route" VARCHAR(255) NOT NULL,
  "number" VARCHAR(50) NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "location" VARCHAR(255),
  "nextStop" VARCHAR(255),
  "eta" VARCHAR(50)
);

-- Bus Routes Table
CREATE TABLE "busRoutes" (
  "id" VARCHAR(255) PRIMARY KEY,
  "number" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "stops" JSONB NOT NULL,
  "frequency" VARCHAR(100) NOT NULL,
  "price" NUMERIC DEFAULT 25
);

-- Tickets Table
CREATE TABLE "tickets" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) REFERENCES "users"("id") ON DELETE SET NULL,
  "route" VARCHAR(255) NOT NULL,
  "from" VARCHAR(255) NOT NULL,
  "to" VARCHAR(255) NOT NULL,
  "price" NUMERIC NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "purchasedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergencies Table
CREATE TABLE "emergencies" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) REFERENCES "users"("id") ON DELETE SET NULL,
  "type" VARCHAR(100) NOT NULL,
  "location" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'dispatched',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Contacts Table
CREATE TABLE "emergencyContacts" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "number" VARCHAR(50) NOT NULL,
  "type" VARCHAR(50) NOT NULL
);


-- 3. SEEDING SEED DATA

-- Users
INSERT INTO "users" ("id", "name", "email", "password", "role", "phone", "googleId", "picture") VALUES
('1', 'Admin User', 'admin@smartcity.gov', '$2a$10$mWPY3xkEjF8jQfxGJkMXce6r4salCMhP25bqFIs6VordS3Y6SvsEu', 'admin', '9876543210', NULL, NULL),
('2', 'John Citizen', 'citizen@example.com', '$2a$10$PHl899l8kymFil8hUoCc6ud8NaKqkYum99hZ28GYRSvuyH61yiR5W', 'citizen', '9876543211', NULL, NULL),
('3f333778-e0b3-4a02-8b63-b3e7325793d7', 'hi', 'hi@gmail.com', '$2a$10$cbxT9DhNMCh8V747KRPjBu11wE1dQ6z36LmPfHVX/VdEpEFrR6flC', 'citizen', '5851052221', NULL, NULL),
('536aa453-3bf7-43bd-a083-d4fcb64ffbf5', 'John Citizen', 'john.citizen@gmail.com', '$2a$10$6N0OvKSnCMDHwGznmDS/S.i9127c6Vric9Hl5sRw0wExgm0NvI1cW', 'citizen', '', 'google_john.citizen', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'),
('f6851ec1-a41d-449f-823d-ec11cba081af', 'Test User', 'test.user@gmail.com', '$2a$10$10u7SZLAlQdOoz3Hdo5AXeZmBAJ2qRXSVLdjPqUqsmC1HeDRGuwIu', 'citizen', '', 'google_test.user', 'https://ui-avatars.com/api/?name=Test%20User&background=2563EB&color=fff'),
('2602b3ee-9bdb-45af-8c11-5a708a3d3ed8', 'shbj', 'dnbmdv@gmail.com', '$2a$10$RX0IkGFIBN0QETDOpraXVer/DsIpeu/Cb9UYpUxJWGoi2E3Zyp7Ve', 'citizen', '', 'google_dnbmdv', 'https://ui-avatars.com/api/?name=shbj&background=2563EB&color=fff'),
('327a9b86-8291-4a20-9245-77de1983a648', 'Gokulapriyan', 'gokul861016@gmail.com', '$2a$10$x9TI/bQwnl531EJyQSqOSOetoG5e/k/5MBBjhR8dnVY5KUkdb05dC', 'citizen', '', '105193912295534312624', 'https://lh3.googleusercontent.com/a/ACg8ocI-UOwQv0wvP1aVUGewHOBjJ4E5PvjJemYcP1XoW4baB6qHfQ=s96-c');

-- Complaints
INSERT INTO "complaints" ("id", "userId", "type", "title", "description", "location", "status", "assignedTo", "createdAt", "updatedAt") VALUES
('c1', '2', 'pothole', 'Large pothole on Main Street', 'Deep pothole near the intersection causing traffic issues', 'Main Street, Block A', 'in_progress', 'Worker #12', '2026-06-20 10:00:00+00', '2026-06-21 14:00:00+00'),
('c2', '2', 'street_light', 'Street light not working', 'Light pole #45 has been dark for 3 days', 'Park Avenue, Sector 3', 'pending', NULL, '2026-06-22 08:30:00+00', '2026-06-22 08:30:00+00'),
('c3', '2', 'garbage', 'Garbage not collected', 'Bins overflowing for 2 days in residential area', 'Green Valley Colony', 'resolved', 'Worker #7', '2026-06-18 06:00:00+00', '2026-06-19 16:00:00+00'),
('809c9db8-480a-4966-adce-e52d2b275038', '3f333778-e0b3-4a02-8b63-b3e7325793d7', 'garbage', 'hi', 'dbdfvd djvd jd', 'gandhi street', 'pending', NULL, '2026-06-23 12:18:24.038+00', '2026-06-23 12:18:24.038+00'),
('698700c5-9400-4568-86e4-a56bfbe857f0', '3f333778-e0b3-4a02-8b63-b3e7325793d7', 'street_light', 'mvncg', 'vjchc', 'jgfj', 'pending', NULL, '2026-06-23 12:25:05.986+00', '2026-06-23 12:25:05.986+00'),
('f7716ce8-a670-4c0b-a665-9f342df7f6f9', '2', 'street_light', 'sdvhjsd', 'vcha j gachjc', 'gandi street', 'pending', NULL, '2026-06-23 12:26:17.920+00', '2026-06-23 12:26:17.920+00'),
('f80babcb-50ac-4d63-a76a-ebdc32e22be8', '536aa453-3bf7-43bd-a083-d4fcb64ffbf5', 'pothole', 'mhvj', 'mvj', 'bhdfhfg', 'pending', NULL, '2026-06-23 12:54:00.675+00', '2026-06-23 12:54:00.675+00'),
('c8492237-9c30-4670-bf97-ecb46918cf0c', '327a9b86-8291-4a20-9245-77de1983a648', 'pothole', 'potholw', 'c kbcxj c cc ', 'gandhi street', 'pending', NULL, '2026-06-23 13:40:13.388+00', '2026-06-23 13:40:13.388+00');

-- Announcements
INSERT INTO "announcements" ("id", "title", "content", "category", "createdAt") VALUES
('a1', 'Water Supply Maintenance', 'Water supply will be interrupted in Sector 5 on June 25 from 9 AM to 3 PM for pipeline maintenance.', 'utilities', '2026-06-23 09:00:00+00'),
('a2', 'Community Clean-up Drive', 'Join us this Saturday for a city-wide clean-up drive. Register at the community center.', 'community', '2026-06-22 11:00:00+00');

-- Workers
INSERT INTO "workers" ("id", "name", "department", "status", "currentTask") VALUES
('w1', 'Worker #7', 'waste', 'active', 'Route B collection'),
('w2', 'Worker #12', 'roads', 'active', 'Pothole repair - Main St'),
('w3', 'Worker #15', 'electricity', 'available', NULL),
('w4', 'Worker #22', 'water', 'active', 'Pipeline inspection');

-- Waste Schedules
INSERT INTO "wasteSchedules" ("id", "area", "day", "time", "vehicleId") VALUES
('ws1', 'Green Valley Colony', 'Monday, Thursday', '6:00 AM - 10:00 AM', 'WM-101'),
('ws2', 'Park Avenue Sector', 'Tuesday, Friday', '7:00 AM - 11:00 AM', 'WM-102'),
('ws3', 'Downtown Commercial', 'Daily', '5:00 AM - 9:00 AM', 'WM-103');

-- Waste Vehicles
INSERT INTO "wasteVehicles" ("id", "driver", "status", "location", "lastUpdated") VALUES
('WM-101', 'Raj Kumar', 'on_route', 'Green Valley', '2026-06-23 08:30:00+00'),
('WM-102', 'Suresh Patel', 'idle', 'Depot', '2026-06-23 07:00:00+00'),
('WM-103', 'Amit Singh', 'on_route', 'Downtown', '2026-06-23 08:45:00+00');

-- Traffic Updates
INSERT INTO "trafficUpdates" ("id", "location", "status", "description", "updatedAt") VALUES
('t1', 'Highway Junction', 'heavy', 'Heavy congestion due to construction', '2026-06-23 08:00:00+00'),
('t2', 'City Center', 'moderate', 'Normal traffic flow', '2026-06-23 08:15:00+00'),
('t3', 'Airport Road', 'clear', 'Clear traffic', '2026-06-23 08:20:00+00');

-- Accidents
INSERT INTO "accidents" ("id", "location", "severity", "description", "status", "reportedAt") VALUES
('acc1', 'Ring Road Exit 3', 'minor', 'Two vehicle collision, no injuries', 'cleared', '2026-06-23 06:30:00+00'),
('acc2', 'Bridge Street', 'moderate', 'Vehicle breakdown blocking lane', 'active', '2026-06-23 08:10:00+00');

-- Utility Bills
INSERT INTO "utilityBills" ("id", "userId", "type", "amount", "dueDate", "status", "usage", "paidAt", "updatedAt") VALUES
('b1', '2', 'water', 450, '2026-07-05', 'paid', '12,500 L', '2026-06-23 12:26:34.117+00', '2026-06-23 12:26:34.117+00'),
('b2', '2', 'electricity', 1250, '2026-07-05', 'paid', '320 kWh', '2026-06-23 12:26:36.018+00', '2026-06-23 12:26:36.019+00'),
('b3', '2', 'water', 380, '2026-06-05', 'paid', '10,200 L', '2026-06-03 10:00:00+00', NULL);

-- Buses
INSERT INTO "buses" ("id", "route", "number", "status", "location", "nextStop", "eta") VALUES
('bus1', 'Route 101', 'SC-101', 'active', 'City Center', 'Central Station', '5 min'),
('bus2', 'Route 205', 'SC-205', 'active', 'Airport Road', 'Terminal 1', '12 min'),
('bus3', 'Route 312', 'SC-312', 'maintenance', 'Depot', NULL, NULL);

-- Bus Routes
INSERT INTO "busRoutes" ("id", "number", "name", "stops", "frequency") VALUES
('r1', '101', 'City Center - North', '["Central Station", "Market Square", "North Terminal"]'::jsonb, 'Every 15 min'),
('r2', '205', 'Airport Express', '["Central Station", "Highway Junction", "Airport Terminal"]'::jsonb, 'Every 20 min'),
('r3', '312', 'East-West Connector', '["East Gate", "City Center", "West Plaza"]'::jsonb, 'Every 25 min');

-- Tickets
INSERT INTO "tickets" ("id", "userId", "route", "from", "to", "price", "status", "purchasedAt") VALUES
('tk1', '2', '101', 'Central Station', 'North Terminal', 25, 'active', '2026-06-23 07:00:00+00'),
('ea02244d-9fd5-43a5-ac68-c75a335917bc', '3f333778-e0b3-4a02-8b63-b3e7325793d7', '205', 'chennai', 'koyambedu', 25, 'active', '2026-06-23 12:19:54.619+00'),
('382603ac-4a2c-4a73-85e8-c3b6d5ef897a', '3f333778-e0b3-4a02-8b63-b3e7325793d7', '101', 'ngch', 'jfh', 25, 'active', '2026-06-23 12:20:05.312+00'),
('a99bd1e1-f4b8-4c43-9444-bab9484e9bc5', '327a9b86-8291-4a20-9245-77de1983a648', '205', 'gyjf', 'mnvbnb', 25, 'active', '2026-06-23 15:51:20.514+00');

-- Emergencies
INSERT INTO "emergencies" ("id", "userId", "type", "location", "description", "status", "createdAt") VALUES
('e1', '2', 'ambulance', '45 Park Avenue', 'Medical emergency - chest pain', 'dispatched', '2026-06-23 07:45:00+00'),
('e2', '2', 'fire', 'Warehouse District Block C', 'Smoke reported from building', 'resolved', '2026-06-22 22:00:00+00'),
('5ef05a26-698a-4c17-b7d6-72e74dd3638c', '3f333778-e0b3-4a02-8b63-b3e7325793d7', 'ambulance', 'gstghf', 'jfjhcgh', 'dispatched', '2026-06-23 12:20:27.689+00'),
('e84e193f-c574-4b5d-be43-dc0d3abcd97c', '3f333778-e0b3-4a02-8b63-b3e7325793d7', 'fire', 'hh', 'nfhd vjgfdh', 'dispatched', '2026-06-23 12:24:43.329+00'),
('0385737b-4d4e-4fc1-b369-09e76026d774', '2', 'fire', 'fnbfnm', 'vbsjdv km md v', 'dispatched', '2026-06-23 12:28:36.729+00'),
('7509202b-e1a4-493c-a92a-5310c3175db4', '327a9b86-8291-4a20-9245-77de1983a648', 'ambulance', 'ncvhn', '', 'dispatched', '2026-06-23 15:49:01.712+00');

-- Emergency Contacts
INSERT INTO "emergencyContacts" ("id", "name", "number", "type") VALUES
('ec1', 'Police', '100', 'police'),
('ec2', 'Fire Service', '101', 'fire'),
('ec3', 'Ambulance', '102', 'ambulance'),
('ec4', 'City Helpline', '1800-SMART-CITY', 'helpline');
