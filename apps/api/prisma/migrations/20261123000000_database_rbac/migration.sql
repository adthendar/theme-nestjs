CREATE TABLE `AccessRole` (
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `description` VARCHAR(240) NOT NULL,
  `system` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AccessPermission` (
  `code` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserRole` (
  `userId` VARCHAR(191) NOT NULL,
  `roleCode` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`userId`, `roleCode`),
  INDEX `UserRole_roleCode_idx` (`roleCode`),
  CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserRole_roleCode_fkey` FOREIGN KEY (`roleCode`) REFERENCES `AccessRole` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RolePermission` (
  `roleCode` VARCHAR(40) NOT NULL,
  `permissionCode` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`roleCode`, `permissionCode`),
  INDEX `RolePermission_permissionCode_idx` (`permissionCode`),
  CONSTRAINT `RolePermission_roleCode_fkey` FOREIGN KEY (`roleCode`) REFERENCES `AccessRole` (`code`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RolePermission_permissionCode_fkey` FOREIGN KEY (`permissionCode`) REFERENCES `AccessPermission` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `AccessRole` (`code`, `name`, `description`, `system`) VALUES
  ('ADMIN', 'Administrator', '', true), ('USER', 'User', '', true);
INSERT INTO `AccessPermission` (`code`) VALUES
  ('dashboard.read'), ('users.read'), ('users.create'), ('users.update'), ('users.delete'),
  ('roles.read'), ('roles.manage'), ('roles.assign'), ('permissions.read'), ('settings.manage');
INSERT INTO `RolePermission` (`roleCode`, `permissionCode`)
  SELECT 'ADMIN', `code` FROM `AccessPermission`;
INSERT INTO `RolePermission` (`roleCode`, `permissionCode`) VALUES ('USER', 'dashboard.read');
INSERT INTO `UserRole` (`userId`, `roleCode`) SELECT `id`, `role` FROM `User`;
