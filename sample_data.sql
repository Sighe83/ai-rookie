-- Sample Data for AI Rookie
-- Run this AFTER running the database_schema.sql

-- Insert sample tutors for B2B
INSERT INTO public.tutors (title, specialty, experience, value_prop, img, base_price, price, site_mode) VALUES
('Marketing Director & AI‑praktiker', 'AI for Marketing & Kommunikation', 'Forstår travle professionelles behov for hurtig, relevant læring.', 'Øg jeres marketing‑output med 10× uden ekstra headcount.', 'https://placehold.co/100x100/E2E8F0/4A5568?text=MJ', 850, 695, 'B2B'),
('Sales VP & Workflow‑Optimist', 'Effektivitets‑boost i salgsorganisationer', 'Specialist i at omsætte AI til målbare salgsresultater.', 'Forkort salgscyklussen med gennemsnitligt 32 %.', 'https://placehold.co/100x100/E2E8F0/4A5568?text=LP', 995, 950, 'B2B'),
('Operations Manager & Automation Expert', 'Proces‑optimering & AI‑workflows', 'Hjælper ledere med at integrere AI i teams og processer.', 'Reducer manuelle processer med op til 60% gennem intelligent automatisering.', 'https://placehold.co/100x100/E2E8F0/4A5568?text=AK', 925, 475, 'B2B');

-- Insert sample tutors for B2C
INSERT INTO public.tutors (title, specialty, experience, value_prop, img, base_price, price, site_mode) VALUES
('Marketing Director & AI Praktiker', 'Praktisk AI for Marketing & Kommunikation', 'Forstår travle professionelles behov for hurtig, relevant læring.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=MJ', 850, 695, 'B2C'),
('Sales VP & Workflow-Optimist', 'Effektivitets-boost med AI for Salgsteams', 'Specialist i at omsætte AI til målbare salgsresultater.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=LP', 995, 950, 'B2C'),
('HR Business Partner & AI Adoption Lead', 'AI for Ledere: Fra Strategi til Handling', 'Hjælper ledere med at integrere AI i teams og processer.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=HN', 925, 475, 'B2C'),
('Indkøbschef & Udbudsspecialist', 'AI i Procurement og EU-udbud', 'Bruger AI til at navigere komplekse udbudsmaterialer og leverandøranalyser.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=CH', 850, 850, 'B2C'),
('Senior Projektleder (PMP)', 'AI-drevet Projektledelse', 'Anvender AI til at forbedre projektplanlægning, risikostyring og stakeholder-kommunikation.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=JT', 750, 750, 'B2C'),
('Lead Developer & Tech Mentor', 'AI for Softwareudviklere', 'Fokuserer på at bruge AI-værktøjer som Copilot til at skrive bedre kode hurtigere og reducere fejl.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=DC', 800, 800, 'B2C'),
('Director of Security, CPH Airport', 'Praktisk AI for Operationelle Ledere', 'Praktisk erfaring med at bruge AI som et ledelsesværktøj til operationel planlægning og analyse.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=HF', 1000, 1000, 'B2C'),
('Advokat & Partner', 'AI i den Juridiske Verden', 'Pioner inden for brug af AI til juridisk research, due diligence og kontraktanalyse.', NULL, 'https://placehold.co/100x100/E2E8F0/4A5568?text=SB', 975, 975, 'B2C');

-- Get the tutor IDs for inserting sessions
-- Note: You'll need to run this query first to get the actual UUIDs, then update the session inserts below

-- B2B Sessions (Marketing tutor - first one)
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Skaler content‑produktionen med AI', 'Strømliner jeres SoMe & kampagner gennem smart prompt‑design og værktøjer.'
FROM public.tutors WHERE specialty = 'AI for Marketing & Kommunikation' AND site_mode = 'B2B' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Datadrevet kampagneoptimering', 'Lær at bruge AI til at analysere kampagnedata og justere i realtid.'
FROM public.tutors WHERE specialty = 'AI for Marketing & Kommunikation' AND site_mode = 'B2B' LIMIT 1;

-- B2B Sessions (Sales tutor)
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Lead‑research på autopilot', 'Automatisér indsamling & kvalificering af leads med AI‑drevne pipelines.'
FROM public.tutors WHERE specialty = 'Effektivitets‑boost i salgsorganisationer' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'AI‑assist til salgs‑mails', 'Personaliser salgs‑kommunikation i skala — uden at miste det menneskelige touch.'
FROM public.tutors WHERE specialty = 'Effektivitets‑boost i salgsorganisationer' LIMIT 1;

-- B2B Sessions (Operations tutor)
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Automatisér dokumenthåndtering', 'Implementér AI‑baserede systemer til at behandle og kategorisere dokumenter.'
FROM public.tutors WHERE specialty = 'Proces‑optimering & AI‑workflows' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Intelligent kvalitetskontrol', 'Opsæt AI‑drevne kontroller der fanger fejl før de når kunden.'
FROM public.tutors WHERE specialty = 'Proces‑optimering & AI‑workflows' LIMIT 1;

-- B2C Sessions (Marketing tutor)
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Få ideer til SoMe-opslag på minutter', 'Lær at bruge AI til at brainstorme og skabe indhold til sociale medier, der fanger opmærksomhed.'
FROM public.tutors WHERE specialty = 'Praktisk AI for Marketing & Kommunikation' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Skriv bedre marketingtekster med AI', 'Optimer dine nyhedsbreve, annoncer og webtekster ved hjælp af en AI-assistent.'
FROM public.tutors WHERE specialty = 'Praktisk AI for Marketing & Kommunikation' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Analyser en konkurrents marketing', 'Få indsigt i dine konkurrenters strategi ved at lade en AI analysere deres online tilstedeværelse.'
FROM public.tutors WHERE specialty = 'Praktisk AI for Marketing & Kommunikation' LIMIT 1;

-- B2C Sessions (Sales tutor)
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Automatiser research af nye leads', 'Spar timer på at finde og kvalificere potentielle kunder med AI-drevne værktøjer.'
FROM public.tutors WHERE specialty = 'Effektivitets-boost med AI for Salgsteams' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Skriv personlige salgs-emails hurtigere', 'Lær teknikker til at skræddersy dine salgs-emails i stor skala uden at miste det personlige touch.'
FROM public.tutors WHERE specialty = 'Effektivitets-boost med AI for Salgsteams' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Forbered dig til et kundemøde med AI', 'Brug AI til at indsamle de vigtigste informationer om en kunde lige før et vigtigt møde.'
FROM public.tutors WHERE specialty = 'Effektivitets-boost med AI for Salgsteams' LIMIT 1;

-- Continue with other B2C sessions...
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Skriv effektive jobopslag med AI', 'Lær at formulere jobopslag, der tiltrækker de rigtige kandidater ved hjælp af AI.'
FROM public.tutors WHERE specialty = 'AI for Ledere: Fra Strategi til Handling' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Introduktion til AI for ledere', 'Få et strategisk overblik over, hvad AI betyder for din afdeling og din rolle som leder.'
FROM public.tutors WHERE specialty = 'AI for Ledere: Fra Strategi til Handling' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Brug AI i MUS-samtaler', 'Opdag hvordan AI kan hjælpe med at forberede og strukturere udviklingssamtaler med medarbejdere.'
FROM public.tutors WHERE specialty = 'AI for Ledere: Fra Strategi til Handling' LIMIT 1;

-- Add more sessions for other tutors
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Analyser udbudsmateriale på rekordtid', 'Lær at bruge AI til hurtigt at ekstrahere krav og risici fra store EU-udbudsdokumenter.'
FROM public.tutors WHERE specialty = 'AI i Procurement og EU-udbud' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Optimer din leverandør-screening', 'Brug AI til at analysere og sammenligne potentielle leverandører baseret på data.'
FROM public.tutors WHERE specialty = 'AI i Procurement og EU-udbud' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Udarbejd et første udkast til tilbud', 'Se hvordan AI kan generere strukturerede og velformulerede første udkast til tilbudsgivning.'
FROM public.tutors WHERE specialty = 'AI i Procurement og EU-udbud' LIMIT 1;

-- Project Management sessions
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Udarbejd projektplaner med AI', 'Lær at bruge AI til at generere tidslinjer, identificere afhængigheder og definere milestones.'
FROM public.tutors WHERE specialty = 'AI-drevet Projektledelse' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Automatiser din statusrapportering', 'Omsæt rå data og noter til præcise og letforståelige statusrapporter for stakeholders.'
FROM public.tutors WHERE specialty = 'AI-drevet Projektledelse' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Identificer projektrisici proaktivt', 'Brug AI til at analysere projektdata og forudse potentielle faldgruber, før de opstår.'
FROM public.tutors WHERE specialty = 'AI-drevet Projektledelse' LIMIT 1;

-- Developer sessions
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Mestr AI-assisteret kodning (Copilot)', 'Lær avancerede teknikker til at få maksimal værdi ud af din AI-kodeassistent.'
FROM public.tutors WHERE specialty = 'AI for Softwareudviklere' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Automatiseret debugging og kode-reviews', 'Se hvordan AI kan finde fejl og foreslå forbedringer i din kodebase.'
FROM public.tutors WHERE specialty = 'AI for Softwareudviklere' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Skriv unit tests på den halve tid', 'Brug AI til at generere meningsfulde og dækkende tests for din kode.'
FROM public.tutors WHERE specialty = 'AI for Softwareudviklere' LIMIT 1;

-- Operations sessions
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'AI som din personlige ledelses-sparringspartner', 'Brug AI til at forberede svære samtaler, analysere team-dynamikker og formulere klar kommunikation.'
FROM public.tutors WHERE specialty = 'Praktisk AI for Operationelle Ledere' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Analyser hændelsesrapporter for mønstre', 'Lær at bruge AI til at finde skjulte sammenhænge og tendenser i store mængder operationel data.'
FROM public.tutors WHERE specialty = 'Praktisk AI for Operationelle Ledere' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Udarbejd bemandingsplaner og scenarier', 'Se hvordan AI kan hjælpe med at optimere ressourceallokering og simulere forskellige operationelle scenarier.'
FROM public.tutors WHERE specialty = 'Praktisk AI for Operationelle Ledere' LIMIT 1;

-- Legal sessions
INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Effektiviser din juridiske research med AI', 'Find relevante domme og lovtekster på en brøkdel af tiden med AI-drevne søgeværktøjer.'
FROM public.tutors WHERE specialty = 'AI i den Juridiske Verden' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Analyser kontrakter for risici og klausuler', 'Lær at bruge AI til hurtigt at identificere problematiske eller vigtige afsnit i juridiske dokumenter.'
FROM public.tutors WHERE specialty = 'AI i den Juridiske Verden' LIMIT 1;

INSERT INTO public.sessions (tutor_id, title, description) 
SELECT id, 'Forbered en sag med AI-drevet dokumentanalyse', 'Se hvordan AI kan organisere og opsummere tusindvis af siders sagsakter til et klart overblik.'
FROM public.tutors WHERE specialty = 'AI i den Juridiske Verden' LIMIT 1;