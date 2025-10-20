# How to Create Roles with Permissions

## Step 1: Get Permission IDs

First, call the permissions endpoint to get valid permission IDs:

```bash
GET /roles/permissions/ids
```

This will return something like:
```json
{
  "status": "success",
  "message": "Permission IDs retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "permissionName": "users.view",
      "permissionGroup": "User Management"
    },
    {
      "_id": "507f1f77bcf86cd799439012", 
      "permissionName": "projects.view",
      "permissionGroup": "Project Management"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "permissionName": "projects.edit", 
      "permissionGroup": "Project Management"
    }
  ]
}
```

## Step 2: Get Admin IDs (Optional)

If you want to assign admins to the role during creation:

```bash
GET /roles/admins/ids
```

This will return:
```json
{
  "status": "success",
  "message": "Admin IDs retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "fullName": "Jane Smith", 
      "email": "jane@example.com",
      "role": "admin"
    }
  ]
}
```

## Step 3: Create Role with Permission IDs and Admin Assignment

Use the actual ObjectIds from steps 1 and 2:

```bash
POST /roles
{
  "name": "Project Manager",
  "description": "Manages projects and assigns tasks",
  "permissions": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "assignedAdmins": ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439022"],
  "priority": "medium"
}
```

### Or create role without admin assignment:

```bash
POST /roles
{
  "name": "Project Manager",
  "description": "Manages projects and assigns tasks",
  "permissions": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "priority": "medium"
}
```

## Step 4: Alternative - Create Role First, Then Assign Permissions

### Create role without permissions:
```bash
POST /roles
{
  "name": "Project Manager",
  "description": "Manages projects and assigns tasks",
  "priority": "medium"
}
```

### Then assign permissions:
```bash
POST /roles/{roleId}/permissions
{
  "permissionIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

## Common Mistakes to Avoid:

❌ **Wrong**: Using permission names
```json
{
  "permissions": ["projects.view", "projects.edit"]
}
```

✅ **Correct**: Using permission IDs
```json
{
  "permissions": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

## Available Endpoints:

- `GET /roles/permissions/ids` - Get all permission IDs
- `GET /roles/admins/ids` - Get all admin IDs for role assignment
- `GET /roles/permissions` - Get permissions grouped by category
- `POST /roles` - Create role (with or without permissions and admins)
- `POST /roles/{roleId}/permissions` - Assign permissions to existing role
- `POST /roles/{roleId}/assign/{adminId}` - Assign role to admin
