Definir variáveis de ambiente no wrangler.toml:

```
JWT_SECRET

DATABASE_HOST	
DATABASE_PASSWORD	
DATABASE_USERNAME	
```

Criar essas tabelas (copia e cola no console do Planetscale):

```
CREATE TABLE `answers` (
	`answer_id` int NOT NULL AUTO_INCREMENT,
	`form_id` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`message` varchar(255) NOT NULL,
	`ip` varchar(128),
	PRIMARY KEY (`answer_id`),
	KEY `idx_form_id` (`form_id`),
	KEY `idx_ip` (`ip`),
	KEY `idx_answers_ip` (`ip`)
) ENGINE InnoDB,
  CHARSET utf8mb4,
  COLLATE utf8mb4_0900_ai_ci;


CREATE TABLE `contact_form` (
	`id` int NOT NULL AUTO_INCREMENT,
	`tenant_id` int NOT NULL,
	`name` varchar(50) NOT NULL,
	`email` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`submission_date` timestamp NULL DEFAULT current_timestamp(),
	PRIMARY KEY (`id`)
) ENGINE InnoDB,
  CHARSET utf8mb4,
  COLLATE utf8mb4_0900_ai_ci;


CREATE TABLE `forms` (
	`id` varchar(20) NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255),
	`visibility` enum('public', 'private') NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	KEY `idx_visibility` (`visibility`)
) ENGINE InnoDB,
  CHARSET utf8mb4,
  COLLATE utf8mb4_0900_ai_ci;


  CREATE TABLE `user` (
	`id` int NOT NULL AUTO_INCREMENT,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `unique_email` (`email`)
) ENGINE InnoDB,
  CHARSET utf8mb4,
  COLLATE utf8mb4_0900_ai_ci;
```

Essas de database vem automaticamente quando faz a integração com o PlanetScale.


Isso é o "Backend" disso daqui:


