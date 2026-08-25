
is srs ki reseacher kro than reseacher ka bad new srs crea kro:# Software Requirements Specification (SRS)

# AI Business Development Assistant System

**Version:** 2.0
**Project Type:** AI-Powered Business Development Assistant
**Architecture:** MERN Stack + Gemini AI + Voice Intelligence

---

# 1. Introduction

## 1.1 Purpose

The purpose of this system is to develop an intelligent **AI Business Development Assistant** for a portfolio website that communicates with website visitors through **text chat and voice interaction**.

The system will understand visitor requirements, answer business-related questions, recommend suitable services, qualify potential clients, and automatically decide whether the response should be delivered as **text or voice** based on user behavior, query complexity, and environmental conditions.

The main goal is to provide a professional AI sales assistant experience and convert website visitors into potential clients.

---

# 1.2 Scope

The AI Business Development Assistant will provide:

* AI-powered customer interaction
* Text-based chat support
* Voice-based conversation
* Automatic language detection
* Automatic response mode selection
* Business requirement analysis
* Service recommendation
* Lead qualification
* Conversation memory
* Admin notifications
* Client engagement automation

The system will work as a virtual business development representative for the company portfolio website.

---

# 2. System Overview

## 2.1 High-Level Architecture

```
Client
Voice 🎤 / Chat 💬
|
↓
React Frontend
|
↓
Node.js + Express Backend
|
┌─────────────────┴─────────────────┐
↓ ↓
AI Decision Engine MongoDB Database
|
↓
Gemini API / gemai-web2api
|
↓
AI Response Generation
|
┌────┴────────┐
↓ ↓
Text Response Voice Response
|
↓
Text-to-Speech
```

---

# 3. AI Assistant Identity Management

## 3.1 AI Personas

The system provides two AI assistant personalities.

## Alex

* Role: AI Business Development Assistant
* Active Time: 12:00 AM – 11:59 AM

## Sophia

* Role: AI Business Development Assistant
* Active Time: 12:00 PM – 11:59 PM

---

## 3.2 Persona Switching Requirements

The system shall:

* Automatically switch between Alex and Sophia according to server local time.
* Display the active assistant name in:

* Chat header
* Typing indicator
* Notifications
* Voice interface
* Conversation messages

The system shall maintain:

* Same conversation context
* Same user memory
* Same knowledge base
* Same client information

during assistant switching.

---

# 4. Functional Requirements

---

# FR-01: Visitor Interaction

The system shall allow visitors to:

* Send text messages
* Send voice messages
* Receive text responses
* Receive voice responses

---

# FR-02: Language Detection

The system shall automatically detect visitor language.

Supported languages:

* English
* Urdu
* Arabic
* French
* Hindi
* Spanish
* Other supported languages

Requirements:

* Reply in the detected language.
* Automatically change language when the user changes language.
* Do not ask language preference manually.

---

# FR-03: Communication Mode Management

The system shall support:

* Default Mode
* Chat Mode
* Voice Mode

The system shall automatically select the best communication mode.

---

## Response Mode Decision Factors

The AI shall analyze:

### User Behavior

* Voice input usage
* Text input usage
* Previous interaction style
* User preference

### Query Complexity

Simple queries:

Examples:

* Available services
* Contact information
* Project list

Response:

→ Text preferred

Complex queries:

Examples:

* Business strategy explanation
* Technical explanation
* Project discussion

Response:

→ Voice preferred when available

### Environment Conditions

The system shall check:

* Microphone availability
* Speaker availability
* Browser support
* Device type
* User activity

---

# FR-04: Speech-to-Text Processing

The system shall convert user voice input into text.

Technology options:

* Faster-Whisper
* Browser Speech Recognition API

Process:

```
User Voice
|
Speech Recognition
|
Text Conversion
|
AI Processing
```

---

# FR-05: AI Response Generation

The system shall generate intelligent responses using:

* Gemini API
* gemai-web2api

The AI shall:

* Understand user intent
* Answer questions
* Explain services
* Recommend solutions
* Assist business decisions

---

# FR-06: Text-to-Speech Processing

The system shall convert AI-generated text into voice.

Technology:

* Kokoro TTS
* Browser SpeechSynthesis

Process:

```
AI Response Text
|
Text-to-Speech
|
Voice Output
```

---

# FR-07: Business Knowledge Management

The system shall use company information from:

* Portfolio
* Services
* Projects
* Technologies
* Experience
* Pricing
* FAQs
* Policies
* Contact details

The system shall use:

* RAG Knowledge Base
* Vector Database

The AI must not:

* Invent information
* Guess pricing
* Create fake project details

---

# FR-08: Requirement Analysis

The system shall analyze:

* Client business goals
* Project requirements
* Industry
* Required features
* Budget
* Timeline
* Technical requirements

The AI shall ask only necessary questions.

---

# FR-09: Service Recommendation

The system shall recommend services based on:

* Business objectives
* Budget
* Timeline
* Technical needs

The AI shall explain why the recommendation is suitable.

---

# FR-10: Lead Qualification

The system shall collect:

* Full Name
* Company Name
* Email Address
* Phone Number
* Country
* Budget
* Timeline
* Project Requirements

The system shall avoid requesting already collected information.

---

# FR-11: Lead Summary Generation

The system shall automatically generate:

* Client information
* Business requirements
* Recommended services
* Budget
* Timeline
* Conversation summary
* Lead status
* Priority level

---

# FR-12: Admin Notification

The system shall notify the admin when:

* Client requests a meeting
* Client requests quotation
* Client wants to start a project
* High-quality lead is detected

Notification channels:

* Admin Dashboard
* Gmail
* WhatsApp Business

---

# FR-13: Conversation Memory

The system shall store:

* Complete conversation history
* User preferences
* Language
* Communication mode
* Lead information
* Timestamps

Database:

* MongoDB

---

# FR-14: Real-Time Status System

The system shall display:

Connection:

* 🟢 Online
* 🔴 Offline

Message Status:

* ⏳ Trying...
* 🎤 Listening...
* ⚙ Processing...
* 🤖 Thinking...
* ✍ Typing...
* ✓ Sent
* ✓✓ Delivered
* 👁 Seen

Voice Status:

* Listening
* Processing
* Thinking
* Speaking

---

# 5. Non-Functional Requirements

## 5.1 Performance

The system should:

* Provide fast responses
* Support multiple users
* Handle real-time communication

---

## 5.2 Security

The system shall:

* Protect user data
* Secure API keys
* Prevent unauthorized access
* Protect company information

---

## 5.3 Reliability

The system should:

* Maintain conversation history
* Handle service failures
* Recover from errors

---

## 5.4 Scalability

The system should support:

* More visitors
* Additional AI models
* More languages
* More business data

---

# 6. Technology Requirements

## Frontend

* React.js
* Tailwind CSS
* WebSocket

## Backend

* Node.js
* Express.js
* REST API

## Database

* MongoDB

## AI Services

* Gemini API / gemai-web2api
* Faster-Whisper
* Kokoro TTS

## Additional Technologies

* RAG
* Vector Database
* Docker
* Git/GitHub

---

# 7. Database Requirements

## Users Collection

```json
{
"name": "",
"email": "",
"company": "",
"language": "",
"preference": ""
}
```

---

## Conversation Collection

```json
{
"userId": "",
"message": "",
"response": "",
"mode": "TEXT/VOICE",
"time": ""
}
```

---

## Leads Collection

```json
{
"name": "",
"company": "",
"email": "",
"service": "",
"budget": "",
"timeline": "",
"status": ""
}
```

---

# 8. Future Enhancements

The system can be extended with:

* WhatsApp AI integration
* Email automation
* CRM integration
* Appointment scheduling
* Advanced analytics
* Multi-agent AI system
* Customer behavior prediction

---

# 9. Conclusion

The AI Business Development Assistant is an intelligent AI-based communication system that combines **natural language processing, voice technology, business automation, and lead management**.

The adaptive response system allows the AI to decide whether text or voice communication is more suitable, creating a personalized and professional customer experience while improving business conversion opportunities.




                              │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │      🔐 ADMIN LOGIN         │                │
│              ├──────────────────────────────┤                │
│              │                              │                │
│              │ Email                        │                │
│              │ [..........................] │                │
│              │                              │                │
│              │ Password                     │                │
│              │ [..........................] │                │
│              │                              │                │
│              │ [        LOGIN              ] │                │
│              │                              │                │
│              │        🔐 Secure Access      │                │
│              └──────────────────────────────┘                │



┌─────────────────────────────────────────────────────────────────────              ┐
│ DASHBOARD                                                         🔔  👤 Faisal  │
├────────────────────────────────────────────────────────────────────              ─┤
│                                                                                   │
│     Dashbaord    ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐ │
│                  │ VISITORS   │ │ NEW LEADS  │ │ MESSAGES   │ │ AI CONVERSATIONS │ │
│                  │   12,540   │ │     86     │ │     42     │ │       328        │ │
│ Portfolio Setting└────────────┘ └────────────┘ └────────────┘ └──────────────────┘ │
│                                                                     │
│                  ┌────────────────────────────────┐ ┌─────────────────────────────┐ │
│                  │ VISITOR ANALYTICS              │ │ SYSTEM STATUS               │ │
│ AI Setting       │                                │ │  AI            ● Online     │ │
│                  │       ╱╲                       │ │  Gmail         ● Connected  │ │
│                  │  ╱╲  ╱  ╲     ╱╲               │ │  Calendar      ● Connected  │ │
│                  │ ╱  ╲╱    ╲___╱  ╲              │ │  WhatsApp      ● Connected  │ │
│                  │                                │ │                             │ │
│  Bussiness                │                                │ │                             │ │
│                  └────────────────────────────────┘ │                             │ │
│                                    └─────────────────────────────┘ │
│                                                                     │
│                   RECENT ACTIVITY                                                     │
│                  ┌─────────────────────────────────────────────────────────────────┐ │
│                  │ ● New contact message                                           │ │
│                  │ ● New project published                                         │ │
│  Setting         │ ● AI model catalog updated                                      │ │
│                  │ ● Calendar meeting requested                                    │ │
│  Logout          │ ● WhatsApp lead received                                        │ │
│                  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Hero Section                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Hero Title         [ Creative]                                            │ │
│ │ Email              [ Web Developer & Designer ]                            │ │
│ │ Description        [ I build modern, responsive... ]                     │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ SOCIAL LINKS                                         [+ Add SOCIAL LINKS]│
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ GitHub           [ https://....................................... ]    │ │
│ │ LinkedIn         [ https://....................................... ]    │ │
│ │ Instagram.       [ https://....................................... ]    │ │
│ │ Twitter          [ https://....................................... ]    │ │
│ │ Email            [faisal@gamil.com]                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘


   FreeLance 
   ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Fivver           [https://....................................... ]
│ │ Updata           [https://....................................... ]
  └──────────────────────────────────────────────────────────────────────────┘


 

│                                                                              │
│                         [ SAVE SETTINGS ]                                    │
└──────────────────────────────────────────────────────────────────────────────┘



┌──────────────────────────────────────────────────────────────────────────────┐
│ ABOUT ME                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROFILE                                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Profile Image                         [ Upload / Replace ]               │ │
│ │                                                                          │ │
│ │ Name          [ Faisal Abbas                                    ]     │ │
│ │ Title         [ Full Stack MERN Developer                       ]     │ │
│ │ Short Bio     [ I build modern web applications...              ]     │ │
│ │ Unirverty Name[The Islamia Unirverty of Bahawalpur]
    Section        [2022-26 ]
    Location  :    [Mailsi ]
    Gmail :        [faisal@gamil.com]

  CV / RESUME                                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Current CV: Faisal-Abbas-CV.pdf                 [ Replace ] [ Remove ]  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
                                                                             │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │

│                                  [ SAVE ]                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ SKILLS & TECHNOLOGIES                           [+ ADD SKILL] [Reorder]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FRONTEND                                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ # │ Skill          │ Level │ Progress │ Status │ Actions                │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ 1 │ React.js       │ 90%   │ ████████ │ ON     │ Edit | Delete          │ │
│ │ 2 │ JavaScript     │ 90%   │ ████████ │ ON     │ Edit | Delete          │ │
│ │ 3 │ HTML/CSS       │ 95%   │ ████████ │ ON     │ Edit | Delete          │ │
│ │ 4 │ Tailwind CSS   │ 85%   │ ███████  │ ON     │ Edit | Delete          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ BACKEND                                                                      │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Node.js        │ 85% │ ███████  │ ON │ Edit | Delete                   │ │
│ │ Express.js     │ 85% │ ███████  │ ON │ Edit | Delete                   │ │
│ │ MongoDB        │ 80% │ ███████  │ ON │ Edit | Delete                   │ │
│ │ REST API       │ 90% │ ████████ │ ON │ Edit | Delete                   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ AI / OTHER                                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Python         │ 80% │ ███████  │ ON │ Edit | Delete                   │ │
│ │ FastAPI        │ 75% │ ██████   │ ON │ Edit | Delete                   │ │
│ │ AI / NLP       │ 75% │ ██████   │ ON │ Edit | Delete                   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPERIENCE TIMELINE                                  [+ ADD EXPERIENCE]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ● EXPERIENCE #01                                                         │ │
│ │                                                                          │ │
│ │ Position       [ Full Stack Developer                              ]    │ │
│ │ Company        [ Freelance / Personal Projects                    ]    │ │
│ │ Start Date     [ 2024 ]          End Date [ Present ]                    │ │
│ │                                                                          │ │
│ │ Description                                                               │ │
│ │ [ Built modern MERN stack applications and REST APIs...............]    │ │
│ │                                                                          │ │
│ │ Technologies                                                             │ │
│ │ [ React ] [ Node.js ] [ MongoDB ] [ Express ]                           │ │
│ │                                                                          │ │
│ │                           [ Edit ] [ Delete ]                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                         │                                                    │
│                         ●                                                    │
│                         │                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ● EXPERIENCE #02                                                         │ │
│ │                                                                          │ │
│ │ Position       [ Web Developer                                      ]    │ │
│ │ Company        [ Project / Organization                            ]    │ │
│ │ Duration       [ 2023 - 2024 ]                                           │ │
│ │                                                                          │ │
│ │ Description    [ .................................................. ]    │ │
│ │                                                                          │ │
│ │                           [ Edit ] [ Delete ]                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘



┌──────────────────────────────────────────────────────────────────────────────┐
│ MY SERVICES                                           [+ ADD SERVICE]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│ │      SERVICE 01      │ │      SERVICE 02      │ │      SERVICE 03      │ │
│ │                      │ │                      │ │                      │ │
│ │                      │ │                      │ │                      │ │
│ │                      │ │                      │ │                      │ │
│ │ MERN Development     │ │ REST API Development │ │ React Development    │ │
│ │                      │ │                      │ │                      │ │
│ │ Short description    │ │ Short description    │ │ Short description    │ │
│ │                      │ │                      │ │                      │ │
│ │ [Edit] [Delete]      │ │ [Edit] [Delete]      │ │ [Edit] [Delete]      │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
│                                                                              │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│ │ AI Integration       │ │ Node.js Backend      │ │ Full Stack Apps      │ │
│ │                      │ │                      │ │                      │ │
│ │ [Edit] [Delete]      │ │ [Edit] [Delete]      │ │ [Edit] [Delete]      │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘




┌──────────────────────────────────────────────────────────────────────────────┐
│ FEATURED PROJECT                      [Edit Project] [+ ADD SERVICE]         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                          │ │
│ │                         PROJECT IMAGE                                    │ │
│ │                                                                          │ │
│ │               [ Upload / Replace ] // multple image select cover image   │ │
│ │                                                                          │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │                                                                          │ │
│ │ Project Name       [ BloodLink                                     ]     │ │
│ │                                                                          │ │
│ │                                                                          │ │
│ │ Description                                                             │ │
│ │ [ Blood Donor Management System....................................]    │ │
│ │                                                                          │ │
│ │ Technologies                                                             │ │
│ │ [ React ] [ Node ] [ MongoDB ] [ Express ]                              │ │
│ │                                                                          │ │
│ │ GitHub            [ URL ............................................]    │ │
│ │ Live Demo         [ URL ............................................]    │ │
│ │                                                                                                                          
│ │                                                                          │ │
│ │                     [ SAVE PROJECT ]                                     │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘



┌──────────────────────────────────────────────────────────────────────────────┐
│ CONTACT MESSAGES                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ [ Search........................ ] [All ▼] [Newest ▼]                       │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ NAME       │ EMAIL          │ SUBJECT       │ STATUS    │ ACTION         │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ John       │ john@...       │ Website       │ ● NEW     │ View           │ │
│ │ Ali        │ ali@...        │ AI Project    │ ● READ    │ View           │ │
│ │ Sarah      │ sarah@...      │ API           │ ● REPLIED │ View           │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ SELECTED MESSAGE                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ From: John Smith                                                        │ │
│ │ Email: john@email.com                                                    │ │
│ │                                                                          │ │
│ │ "I would like to discuss a MERN stack project..."                       │ │
│ │                                                                          │ │
│ │ [ Reply ] [ Mark Read ] [ Archive ] [ Delete ]                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

Portfolio Setting :Header Navbar ( 1.Hero Section,2.ABOUT ME,3.SKILLS & TECHNOLOGIES ,4.EXPERIENCE TIMELINE ,5.MY SERVICES ,6.FEATURED PROJECT,7.CONTACT MESSAGES)


Bussiness 
┌──────────────────────────────────────────────────────────────────────────────┐
│ BUSINESS                                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ LEADS                                                                    │ │
│ ├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤ │
│ │ Name         │ Email        │ Service      │ Status       │ Action      │ │
│ ├──────────────┼──────────────┼──────────────┼──────────────┼─────────────┤ │
│ │ Client 01    │ email...     │ Web App      │ New          │ View        │ │
│ │ Client 02    │ email...     │ AI           │ Contacted    │ View        │ │
│ └──────────────┴──────────────┴──────────────┴──────────────┴─────────────┘ │
│                                                                              │
│ ┌──────────────────────────────┐  ┌───────────────────────────────────────┐ │
│ │ MESSAGES                    │  │ MEETINGS                              │ │
│ │                              │  │                                       │ │
│ │ New      12                  │  │ Pending       4                       │ │
│ │ Read     30                  │  │ Confirmed     8                       │ │
│ │ Replied  18                  │  │ Completed     6                       │ │
│ └──────────────────────────────┘  └───────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

1

┌──────────────────────────────────────────────────────────────────────────────┐
│ AI ASSISTANT CONTROL                                                        │
├───────────────────────┬──────────────────────────────────────────────────────┤
│                                                                              │
│               │  AI STATUS                                                   │
│                       │                                                      │
│  AI Assistant       [ ● ENABLED ]                                             │
│  Chat               [ ● ENABLED ]                                              │
│  Voice              [ ● ENABLED ]                                              │
│  File Upload        [ ○ DISABLED ]                                             │
│  Auto Detect        [ ● ENABLED ]                                                │
│  Emotion            [ ● ENABLED ]                                                  │
│DEFAULT MODE                                                                           │
│  [ Chat ▼ ]                                                                       │
│                                                                                     │
│  LANGUAGE                                                                           │
│    [ Auto Detect ▼ ] 
  Emotion Detect
     [ Auto Detect ▼ ] 
                                   │
│                                                     │                                                  
│                       │            [ SAVE SETTINGS ] 
2

┌──────────────────────────────────────────────────────────────────────────────┐
│ AI PERSONA                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────┐    ┌─────────────────────────────────────┐ │
│ │  Assistant name: [.....]      │    │  Assistant name : [......]          │ │
│ │                              │    │                                     │ │
│ │  Active Time                 │    │  Active Time                         │ │
│ │  12:00 AM - 11:59 AM         │    │  12:00 PM - 11:59 PM                │ │
│ │                              │    │                                     │ │
│ │  Tone:  [ Professional ▼ ]    │   │  Tone:  [ Professional ▼ ]          │ │
  │  VOLUME       [────────●──]   │   │  VOLUME       [────────●──]         │
│ │  SPEED       [──────●────]    │   │  SPEED       [──────●────] 
    PITCH        [────●──────]        │  PITCH        [────●──────]         ││
│ │                              │    │                                     │ │
│ │ [ Test Voice ] [ Save ]      │    │ [ Test Voice ] [ Save ]             │ │
│ └──────────────────────────────┘    └─────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘



3

┌──────────────────────────────────────────────────────────────────────────────┐
│ API MANAGER                                      [+ ADD API] [Refresh All]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ API NAME        PROVIDER        TYPE        STATUS       ACTION          │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ NVIDIA          NVIDIA          AI          ● Connected   Manage          │ │
│ │ Google Gmail    Google          Email       ● Connected   Manage          │ │
│ │ Google Calendar Google          Calendar    ● Connected   Manage          │ │
│ │ WhatsApp        Meta            Messaging   ● Connected   Manage          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ SECURITY                                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ API Keys         ● Encrypted                                             │ │
│ │ OAuth Tokens     ● Encrypted                                             │ │
│ │ Secrets          ● Server-side only                                      │ │
│ │ HTTPS            ● Enabled                                               │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ADD API                                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Provider                                                     │
│ [ Select Provider ▼ ]                                        │
│                                                              │
│ API Name                                                    │
│ [......................................................]     │
│                                                              │
│ API Key                                                     │
│ [••••••••••••••••••••••••••••••••••••••••••••]            │
│                                                              │
│ Base URL                                                    │
│ [......................................................]     │
│                                                              │
│ Model / Service                                             │
│ [......................................................]     │
│                                                              │
│ Status                                                      │
│ [ ● Enabled ]                                               │
│                                                              │
│              [ Test Connection ] [ Save API ]                │
└──────────────────────────────────────────────────────────────┘

4. AI MODEL MANAGER

┌──────────────────────────────────────────────────────────────────────────────┐
│ AI MODEL MANAGER                                [Fetch Models] [Refresh]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROVIDER                                                                     │
│ [ NVIDIA ▼ ]                                                                 │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ MODEL                    TYPE       CAPABILITY      STATUS      ACTION    │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ Model A                  LLM        Chat            ● Active    Select    │ │
│ │ Model B                  LLM        Chat            ○ Available Select    │ │
│ │ Model C                  Vision     Vision          ○ Available Select    │ │
│ │ Model D                  STT        Speech          ○ Available Select    │ │
│ │ Model E                  TTS        Voice           ○ Available Select    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ CATEGORIES                                                                   │
│                                                                              │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│ │ LLM        │ │ VISION     │ │ STT        │ │ TTS        │                 │
│ │     81     │ │      6     │ │      3     │ │      0     │                 │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                 │
│                                                                              │
│ ACTIVE MODEL                                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Chat Model        [............................................. ▼]      │ │
│ │ Vision Model      [............................................. ▼]      │ │
│ │ STT Model         [............................................. ▼]      │ │
│ │ TTS Provider      [............................................. ▼]      │ │
│ │                                                                          │ │
│ │                         [ SAVE MODEL CONFIG ]                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

5. GOOGLE GMAIL
┌──────────────────────────────────────────────────────────────────────────────┐
│ GOOGLE GMAIL                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CONNECTION                                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Gmail Account                                                            │ │
│ │                                                                          │ │
│ │              ● CONNECTED                                                │ │
│ │                                                                          │ │
│ │              account@gmail.com                                           │ │
│ │                                                                          │ │
│ │ [ Test Connection ]                [ Disconnect ]                        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ EMAIL MANAGEMENT                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Receive Contact Emails        [ ● ON ]                                  │ │
│ │ Receive Lead Notifications    [ ● ON ]                                  │ │
│ │ Meeting Notifications         [ ● ON ]                                  │ │
│ │ AI Lead Notifications         [ ● ON ]                                  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ AUTOMATION                                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ New Lead → Send Email Notification             [ ● ON ]                  │ │
│ │ Meeting Request → Send Notification             [ ● ON ]                  │ │
│ │ AI Lead → Send Summary                          [ ● ON ]                  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                         [ SAVE GMAIL SETTINGS ]                              │
└──────────────────────────────────────────────────────────────────────────────┘
6. GOOGLE CALENDAR
┌──────────────────────────────────────────────────────────────────────────────┐
│ GOOGLE CALENDAR                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CONNECTION                                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Google Calendar                                                          │ │
│ │                                                                          │ │
│ │                    ● CONNECTED                                          │ │
│ │                                                                          │ │
│ │ [ Test Connection ]                [ Disconnect ]                        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ CALENDAR SETTINGS                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Calendar              [ Primary Calendar ▼ ]                             │ │
│ │ Timezone              [ Asia/Karachi ▼ ]                                │ │
│ │ Meeting Duration      [ 30 Minutes ▼ ]                                  │ │
│ │ Buffer Time           [ 15 Minutes ▼ ]                                  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ AVAILABILITY                                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Monday       [ 09:00 ] → [ 18:00 ]                                     │ │
│ │ Tuesday      [ 09:00 ] → [ 18:00 ]                                     │ │
│ │ Wednesday    [ 09:00 ] → [ 18:00 ]                                     │ │
│ │ Thursday     [ 09:00 ] → [ 18:00 ]                                     │ │
│ │ Friday       [ 09:00 ] → [ 18:00 ]                                     │ │
│ │ Saturday     [ OFF ]                                                    │ │
│ │ Sunday       [ OFF ]                                                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ AI MEETING AUTOMATION                                                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ AI can check availability             [ ● ON ]                           │ │
│ │ AI can request meeting                [ ● ON ]                           │ │
│ │ Admin confirmation required           [ ● ON ]                           │ │
│ │ Create Calendar Event                 [ ● ON ]                           │ │
│ │ Send confirmation email               [ ● ON ]                           │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
──────────────────────────────────────────────────────────────────────────────┘
7. WHATSAPP CONNECT
┌──────────────────────────────────────────────────────────────────────────────┐
│ WHATSAPP BUSINESS                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CONNECTION                                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ WhatsApp Business                                                        │ │
│ │                                                                          │ │
│ │ Status              ● CONNECTED                                         │ │
│ │ Phone Number        +92 XXX XXXXXXX                                     │ │
│ │ Business Account    Connected                                           │ │
│ │                                                                          │ │
│ │ [ Test Message ]                  [ Disconnect ]                         │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ MESSAGING                                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ New Lead Notification          [ ● ON ]                                 │ │
│ │ Contact Form Notification      [ ● ON ]                                 │ │
│ │ Meeting Notification           [ ● ON ]                                 │ │
│ │ AI Lead Notification           [ ● ON ]                                 │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ AI COMMUNICATION                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ AI WhatsApp Chat             [ ○ OFF ]                                  │ │
│ │ AI Auto Reply                [ ○ OFF ]                                  │ │
│ │ Human Handoff                [ ● ON ]                                   │ │
│ │ Admin Approval               [ ● ON ]                                   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                         [ SAVE WHATSAPP SETTINGS ]                           │
└──────────────────────────────────────────────────────────────────────────────┘


8

┌──────────────────────────────────────────────────────────────────────────────┐
│ AI KNOWLEDGE BASE                              [+ ADD KNOWLEDGE]              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ CATEGORY          │ ITEMS │ LAST UPDATED │ STATUS │ ACTION               │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ About             │  8    │ Today        │ Active │ Edit                 │ │
│ │ Projects          │  12   │ Today        │ Active │ Edit                 │ │
│ │ Services          │  6    │ Yesterday    │ Active │ Edit                 │ │
│ │ Pricing           │  5    │ Yesterday    │ Active │ Edit                 │ │
│ │ FAQs              │ 18    │ Today        │ Active │ Edit                 │ │
│ │ Policies          │  7    │ 2 days ago   │ Active │ Edit                 │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘


AI Setting: Header Navbar (1.AI ASSISTANT CONTROL,2.AI PERSONA,3.API MANAGER,4.AI MODEL MANAGER,5.GOOGLE GMAIL,6.CALENDAR SETTINGS,7.WHATSAPP CONNECT,8.AI KNOWLEDGE BASE )



Setting
┌──────────────────────────────────────────────────────────────────────────────┐
│ SECURITY CENTER                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ADMIN ACCOUNT                                                                │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Admin Email       [.................................]                    │ │
│ │ Password          [ ••••••••••••••••••••••• ] [ Change ]                │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ TWO FACTOR AUTHENTICATION                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ 2FA Status                       ● ENABLED                               │ │
│ │                                         [ Manage 2FA ]                   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ LOGIN PROTECTION                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Rate Limiting                    ● ENABLED                               │ │
│ │ Failed Login Protection          ● ENABLED                               │ │
│ │ Session Timeout                  [ 30 Minutes ▼ ]                        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ACTIVE SESSIONS                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ CURRENT DEVICE       Chrome / Windows       ● Active                     │ │
│ │ OTHER DEVICE         Chrome / Windows       ● Active                     │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                       [ LOGOUT ALL OTHER DEVICES ]                           │
└──────────────────────────────────────────────────────────────────────────────┘