--
-- PostgreSQL database cluster dump
--

\restrict 7NhLa7jVrb1tjbY5FNuwE112YaRCaPax5dBVDVfgZWjsu03BWxskZ2sYhJKAg6c

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE r4v3c4t;
ALTER ROLE r4v3c4t WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:QSlLsmtEPu8rlb+13/LYPA==$u/EgND4nD18ATzge/XCPWEmfak5IRaIJ/Ij5mhrgzBs=:f4tYtsH9TO4C9D2usHW4LznafVtxaJeWws13WxuvCU0=';

--
-- User Configurations
--








\unrestrict 7NhLa7jVrb1tjbY5FNuwE112YaRCaPax5dBVDVfgZWjsu03BWxskZ2sYhJKAg6c

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict GW7hamvedqC4wWKb84FI3vXtlmuzevx6fuqMY7V1sNN1Po8ow4SZ3HxITCaGivu

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict GW7hamvedqC4wWKb84FI3vXtlmuzevx6fuqMY7V1sNN1Po8ow4SZ3HxITCaGivu

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict ZOAbTcbDeafRSt5O7We2Wjikcwv0iKN6MYZ0gvkex2KqCzjJlnUWSGDmelbQeGN

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict ZOAbTcbDeafRSt5O7We2Wjikcwv0iKN6MYZ0gvkex2KqCzjJlnUWSGDmelbQeGN

--
-- Database "rvchan_db" dump
--

--
-- PostgreSQL database dump
--

\restrict w5eTa0T5KeGTUxW95L4Pa5En87NVRiebYOusv78cGmjNPh3qO0wfWVMzIbHydyV

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rvchan_db; Type: DATABASE; Schema: -; Owner: r4v3c4t
--

CREATE DATABASE rvchan_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rvchan_db OWNER TO r4v3c4t;

\unrestrict w5eTa0T5KeGTUxW95L4Pa5En87NVRiebYOusv78cGmjNPh3qO0wfWVMzIbHydyV
\connect rvchan_db
\restrict w5eTa0T5KeGTUxW95L4Pa5En87NVRiebYOusv78cGmjNPh3qO0wfWVMzIbHydyV

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: r4v3c4t
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO r4v3c4t;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: r4v3c4t
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO r4v3c4t;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: r4v3c4t
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: refresh_token_entity; Type: TABLE; Schema: public; Owner: r4v3c4t
--

CREATE TABLE public.refresh_token_entity (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "tokenHash" character varying NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer,
    ip character varying DEFAULT 'unknown'::character varying NOT NULL,
    "userAgent" character varying DEFAULT 'unknown'::character varying NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deviceId" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    browser character varying,
    "browserVersion" character varying,
    "deviceModel" character varying,
    "deviceType" character varying,
    "deviceVendor" character varying,
    os character varying,
    "osVersion" character varying
);


ALTER TABLE public.refresh_token_entity OWNER TO r4v3c4t;

--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: r4v3c4t
--

CREATE TABLE public.user_entity (
    id integer NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    username character varying,
    "isPrivate" boolean DEFAULT true NOT NULL,
    state character varying DEFAULT 'INIT'::character varying NOT NULL,
    "firstName" character varying DEFAULT ''::character varying NOT NULL,
    "lastName" character varying,
    description character varying
);


ALTER TABLE public.user_entity OWNER TO r4v3c4t;

--
-- Name: user_entity_id_seq; Type: SEQUENCE; Schema: public; Owner: r4v3c4t
--

CREATE SEQUENCE public.user_entity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_entity_id_seq OWNER TO r4v3c4t;

--
-- Name: user_entity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: r4v3c4t
--

ALTER SEQUENCE public.user_entity_id_seq OWNED BY public.user_entity.id;


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: user_entity id; Type: DEFAULT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.user_entity ALTER COLUMN id SET DEFAULT nextval('public.user_entity_id_seq'::regclass);


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: r4v3c4t
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1769705449319	CreateUser1769705449319
2	1769774181061	CreateRefreshToken1769774181061
3	1770025981891	UpdateUsersColumn1770025981891
4	1770033892500	UpdateRefreshTokenColumns1770033892500
5	1770047943770	AddUpdatedAtColumn1770047943770
6	1770203916084	AddDeviceID1770203916084
39	1770823944553	UserStateEnumRename1770823944553
40	1771950113420	RefreshTokenAddDeviceInfo1771950113420
\.


--
-- Data for Name: refresh_token_entity; Type: TABLE DATA; Schema: public; Owner: r4v3c4t
--

COPY public.refresh_token_entity (id, "tokenHash", "expiresAt", "createdAt", "userId", ip, "userAgent", "updatedAt", "deviceId", browser, "browserVersion", "deviceModel", "deviceType", "deviceVendor", os, "osVersion") FROM stdin;
21fca736-970c-49d2-95aa-4eeb9604fcf9	$2b$10$EzAdNFlvOJ7LRjapExLo8OvPYSIupTklrxjnSuONKupWP/nTOn.Iq	2026-03-10 17:58:55.425	2026-03-03 17:58:55.426395	6	2a02:2378:123f:4729:116d:2a4d:e5cf:f68, 127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/23A355 Safari/604.1	2026-03-03 17:58:55.426395	bb58ab3b-35b6-4a8e-9b7a-d93c496288ee	Mobile Safari	26.0.1	iPhone	mobile	Apple	iOS	18.7
4d05a63f-e4ad-4df8-8e10-a339aade8c98	$2b$10$EFeT0bfyFT5DyWk1Enk7Meu6ah8CnBG9yjmuLgavE3bajBasgskme	2026-03-10 18:01:11.442	2026-03-03 18:01:11.443028	7	193.105.164.25, 127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	2026-03-03 18:01:11.443028	dd7dda92-14b1-4a40-82ea-dd9b413fc630	Mobile Chrome	145.0.7632.108	iPhone	mobile	Apple	iOS	18.2.0
f1645719-17f2-409e-8019-ecb117649bb0	$2b$10$QW1zRUV8FRhQqB61C8SeXeDW0j/nN/.S5Wqxq2iaTtgWWw8CX9ij2	2026-03-10 18:56:34.47	2026-03-03 18:56:34.470419	1	195.138.78.86, 127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/23B85 Safari/604.1	2026-03-03 18:56:34.470419	6c1ddc47-1957-4d04-bcaa-3cd47ea9b3a5	Mobile Safari	26.1	iPhone	mobile	Apple	iOS	18.7
86d3dc92-2a6e-4b42-b058-a7ee156add55	$2b$10$E1CJ7ivXo2S8TA.A5MppvO.0RA.nSwtUigdUV9SUcYJCVqzPVRZzu	2026-03-10 18:12:56.63	2026-03-03 18:12:56.630694	9	94.43.213.92, 127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-03 18:12:56.630694	35590cea-1429-4066-8321-5c59ecce55cc	Chrome	145.0.0.0	unknown	desktop	unknown	Linux	unknown
22c54774-a9d1-41da-8bbc-528b4f402d19	$2b$10$1.GkO.kc2yMY73.zmcF0IOLk8upGsFGqqcXDIWC.pVYSgtcg0z5/K	2026-03-10 19:33:29.547	2026-03-03 19:33:29.547522	11	86.124.206.118, 127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-03-03 19:33:29.547522	aca3160d-8be6-48fe-8c3e-940ccf3c6ae4	Firefox	148.0	unknown	desktop	unknown	Windows	10
dd1f589c-133b-4ec7-8068-34ad03970a38	$2b$10$AGB/gtNrEEuiLkamb28CIOydxQyzBv8BPFoCMN4wJOOX1RLZEJIe.	2026-03-10 19:48:53.852	2026-03-03 18:16:12.877462	1	193.105.164.25, 127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-03-03 19:48:53.856709	2e4ed1c3-d464-4a48-8e07-0fe471dfb57a	Chrome	143.0.0.0	unknown	desktop	unknown	Linux	unknown
5d022af9-d999-4e2c-8ca6-08cadc178f0a	$2b$10$njQ2.tINKA1FW1Jz3TFmQOuTDq0kUVFjSDuKVW8TNLcGsWaSmNMHy	2026-03-10 20:16:26.112	2026-03-03 20:16:26.11302	12	46.133.4.118, 127.0.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-03-03 20:16:26.11302	d143479c-a244-4bb2-a76d-7f177dd33fa0	Mobile Chrome	145.0.0.0	K	mobile	unknown	Android	10
f962e1f4-ec6c-44ed-8a6f-cd49bdf845f8	$2b$10$30EfH/Y5itsgtuL.gN/dJuvnafRvC/znR0PpkM8k0XrwothWjyHTe	2026-03-10 20:19:08.761	2026-03-03 20:19:08.762644	13	195.64.229.253, 127.0.0.1	Mozilla/5.0 (Linux; Android 15; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.120 Mobile Safari/537.36	2026-03-03 20:19:08.762644	d5ed2219-eba2-4b56-9666-e33d4bdb1266	Mobile Chrome	145.0.7632.120	K	mobile	unknown	Android	15
5b1759d9-7791-461d-8ed1-431ae0b8809e	$2b$10$uNc8Y0MPWgT0XFfWNFTLMe0Zql5lz3giYpQs4tk.9sOLBCif//eqW	2026-03-10 20:39:05.484	2026-03-03 20:39:05.484991	13	195.64.229.253, 127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-03 20:39:05.484991	07ee787a-cd46-4924-9e2e-391440053fd4	Chrome	145.0.0.0	unknown	desktop	unknown	Windows	10
\.


--
-- Data for Name: user_entity; Type: TABLE DATA; Schema: public; Owner: r4v3c4t
--

COPY public.user_entity (id, email, password, username, "isPrivate", state, "firstName", "lastName", description) FROM stdin;
1	user@example.com	$2b$10$XJ3xaonkxmpY2Xu44Ow/X.UyslvnLEiYHiMzjlIRTdBf56KOblBca	murleek	t	ACTIVE	"><img src=x onerror=prompt(1);>	urla	something shit in my description
6	smarselatov@gmail.com	$2b$10$U4LGxMSV9sB5xmDQ6Jd9GuxmyvtSMG/4yLlA1HtsfEQDTAJkW8n9O	Sh1d0	t	ACTIVE	Сергей	Ткачук	Увлекаюсь играми, люблю дружаньку Максимку
7	olyageorgica7@gmail.com	$2b$10$cTbo/QEMCCKfsbuZzdP8r.xle2K2Im7.RNnCp24H61aUqqLZwL9M2	lufeliz	t	ACTIVE	мяу мяу мяу	\N	\N
9	aboba@gmail.com	$2b$10$DcFdT7DVKfUw1ZMfuCsBtuNV3rnnD73RqoRH/XCoIMT/RAzuVMDrC	ya_eto_67	t	ACTIVE	67	\N	\N
11	ivd74788@laoia.com	$2b$10$62f8T9dCsCQJjD3AO7bXauiTQDhVEp8jeM5iKxz7MaUUPlrkLCBRq	gneg64	t	ACTIVE	Андрюха	Гнег	Я очень крутой и ещё я гнег.
12	Xui@gmail.com	$2b$10$mGyswu9h4KmBOluElwLxKOn8QrmK5a2pTG8htiiwV4C4a6Pu5QQ76	SmokeyHoka	t	ACTIVE	Mykola	Geniy	Xueplet
13	comf001571@gmail.com	$2b$10$sz8mvz9v0kNU0aTt.5TB5.LALqyBbpdPWuvGDbDaHhlLbO55BTrZK	hikkiman	t	ACTIVE	vlad	zepish	\N
14	x@x.xx	$2b$10$iXMNN4nzHnHsNk8nOOUTVuqKYmWcfkngv49lOnxNZsnQcpRXqMRhO	\N	t	INIT		\N	\N
15	a@a.aa	$2b$10$wtft4VHJbss8eK1S9CCnbeB/khHYuHgXPe1rY5uGkjHHhw3W.GTay	\N	t	INIT		\N	\N
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: r4v3c4t
--

SELECT pg_catalog.setval('public.migrations_id_seq', 40, true);


--
-- Name: user_entity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: r4v3c4t
--

SELECT pg_catalog.setval('public.user_entity_id_seq', 15, true);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: refresh_token_entity PK_a78813e06745b2c5d5b9776bfcf; Type: CONSTRAINT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.refresh_token_entity
    ADD CONSTRAINT "PK_a78813e06745b2c5d5b9776bfcf" PRIMARY KEY (id);


--
-- Name: user_entity PK_b54f8ea623b17094db7667d8206; Type: CONSTRAINT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY (id);


--
-- Name: user_entity UQ_415c35b9b3b6fe45a3b065030f5; Type: CONSTRAINT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT "UQ_415c35b9b3b6fe45a3b065030f5" UNIQUE (email);


--
-- Name: user_entity UQ_9b998bada7cff93fcb953b0c37e; Type: CONSTRAINT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT "UQ_9b998bada7cff93fcb953b0c37e" UNIQUE (username);


--
-- Name: refresh_token_entity FK_ebf65cd067163c7c66baa3da1c1; Type: FK CONSTRAINT; Schema: public; Owner: r4v3c4t
--

ALTER TABLE ONLY public.refresh_token_entity
    ADD CONSTRAINT "FK_ebf65cd067163c7c66baa3da1c1" FOREIGN KEY ("userId") REFERENCES public.user_entity(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict w5eTa0T5KeGTUxW95L4Pa5En87NVRiebYOusv78cGmjNPh3qO0wfWVMzIbHydyV

--
-- PostgreSQL database cluster dump complete
--

COMMIT