Objective
Build a clickable prototype showing how an Oil & Gas technology company can manage and coordinate project execution after a contract is awarded, when the Project Manager, Commercial, Technical/Lab, Operations, Procurement/Logistics, Management, Suppliers, and the Client all become involved.
The Project Manager should have one central operational view of:
Project Progress → Responsibilities → Technical Status → Changes → Issues/Delays → Cost Impact → Timeline Impact → Actions → Decisions
The goal is to help the Project Manager quickly understand: what is happening, what changed, who owns it, what is waiting, what is at risk, what is affected, and what decision is required.
Important Note
This is a clickable prototype only. No real backend, database, AI model, email integration, WhatsApp integration, document storage, authentication, notifications, ERP integration, laboratory-equipment integration, accounting integration, chemical calculations, or other live systems.
All data is mocked.
The system should organize the workflow around the company's technical and operational work. It must not automate laboratory conclusions, treatment decisions, chemical calculations, engineering judgment, or internal SOPs.
Central Project Manager Rule
The Project Manager is the central coordinator and project-level decision owner.
Other teams own and complete their specialist work, while the Project Manager maintains visibility across the complete project and coordinates the impact of those activities.
Example:
Lab Analysis: Responsible Team: Technical/Lab, Assigned Person: Technical Engineer, Status: In Progress, Due Date: 12 Sep, Waiting On: Client Sample Information, Impact if Late: Technical Proposal May Be Delayed.
The Technical Team performs the analysis. The Project Manager sees its status and understands how it affects the wider project.
Do not make every department an equal project-level decision maker.
Primary Users
1. Project Manager – reviews overall project status, progress, responsibilities, milestones, changes, issues, dependencies, overdue actions, cost/timeline impact, client dependencies, and project-level decisions.
2. Technical / Lab Team – manages sample status, laboratory analysis, treatment/testing status, technical evaluation, technical proposal status, technical records, and technical impact assessments.
3. Operations Team – manages execution readiness, manpower, equipment, mobilization, field progress, operational issues, delays, and operational impact assessments.
4. Commercial / Business Team – manages awarded commercial scope, scope-change implications, additional-cost impact, commercial review, and relevant client/commercial actions.
5. Procurement / Logistics Team – manages material/chemical availability, suppliers, equipment/material requirements, deliveries, procurement dependencies, logistics, and mobilization dependencies.
6. Management / Executive Viewer – reviews project health, major delays, risks, cost/timeline exposure, major changes, escalations, and important decisions without taking over day-to-day project coordination.
7. Admin – manages mocked users, roles, projects, phases, categories, statuses, and system data.
External Parties
Client – provides requirements, samples/information, approvals, scope changes, technical reviews, validation, and completion/sign-off dependencies.
Supplier – provides chemicals/materials/equipment and creates delivery or procurement dependencies.
Client and Supplier are external parties. Do not treat them as internal company roles or create unnecessary external dashboards.
Four Confirmed Operational Problems
1. Delivery Against Promised Timelines – Commercial may commit to a delivery date when the contract is won, while Technical and Operations must deliver against that commitment.
2. Communication Between Parties – information can become unclear, scattered, or delayed when several departments, suppliers, management, and the Client become involved.
3. Clear Ownership & Responsibility – every important activity, issue, change, and decision needs a clearly identified responsible team/person, while the Project Manager coordinates the overall project.
4. Cost & Timeline Control – procurement delays, scope changes, technical problems, client requests, and operational issues can affect project cost and delivery schedule.
The prototype must clearly demonstrate all four.
Technical Project Flow
Use a specialist Oil & Gas technical-operation workflow:
Contract Award → Client Technical Requirement → Sample Collection / Receipt → Laboratory Characterization / Analysis → Treatment Testing → Technical Evaluation → Technical Proposal → Client Technical Review / Approval → Execution Readiness → Mobilization → Field Execution → Performance Verification → Technical Completion → Client Validation / Sign-Off
The workflow should remain flexible enough for different project types.
Core Use Case
A contract is awarded, project is created, Project Manager is assigned, client requirements and commitments are recorded, technical preparation begins, sample/information is received, analysis/testing is completed, technical proposal is prepared, client approval is tracked, execution readiness is reviewed, mobilization and field execution begin, a change/issue/delay occurs, affected departments assess their impact, Project Manager reviews the combined impact, project-level decision is recorded, actions/timeline/status update, project continues through completion and client validation.
Minimum Screens
Login/Role Selection, Project Manager Dashboard, Projects List, Project Detail, Project Setup, Technical Workflow, Execution Readiness, Project Timeline/Milestones, Change & Impact Management, Change Detail, Issues & Risks, Action & Responsibility Tracker, Cost & Timeline Impact View, Documents/Technical Records, Activity/Project History, Completion & Client Validation, Management Overview, Admin Dashboard, Admin User/Role Management.
Project Manager Dashboard
This is the most important screen.
Within approximately 30 seconds, the Project Manager should be able to understand: project health, current phase, progress, promised completion date, forecast completion date, schedule status, cost/commercial exposure, open changes, open issues, overdue actions, current dependencies, upcoming milestones, readiness status, recent activity, and decisions requiring attention.
Include a prominent What Needs Your Attention section.
Examples: client scope change awaiting decision, material/chemical delivery delayed by 2 days, technical proposal waiting on analysis, mobilization milestone at risk, client technical approval overdue.
All attention items should be clickable.
Projects List
Show realistic mocked project cards/table with: project name, client, facility/site, project type, Project Manager, current phase, progress, promised completion date, forecast completion date, project health, open changes, open issues, overdue actions, cost/timeline exposure.
Project Detail Page
Show: project name, client, facility/site, Project Manager, project type, scope summary, current phase, overall progress, promised completion date, forecast completion date, cost/timeline status, risks, and dependencies.
Tabs: Overview, Technical, Readiness, Timeline, Changes, Issues, Actions, Documents, Activity, Completion.
Project Setup
Fields: project name, client, facility/site, project type, scope summary, Project Manager, project start date, promised completion date, forecast completion date, current phase, commercial commitment placeholder, client contact placeholder, project status.
Technical Workflow
Stages: Sample / Technical Information Received, Lab Characterization, Treatment Test, Technical Evaluation, Technical Proposal, Client Technical Review, Pilot / Field Validation where applicable, Execution Ready.
Each stage should show: status, responsible Technical/Lab person, start date, due date, outcome placeholder, linked-document placeholder, dependency, impact if delayed.
No real chemical calculations or technical recommendations.
Execution Readiness
Readiness items: Technical Readiness, Material/Chemical Availability, Equipment Readiness, Manpower Readiness, Procurement Readiness, Logistics Readiness, Client Approval, Site Access, Mobilization Readiness.
Statuses: Ready, In Progress, At Risk, Blocked, Not Started.
Each item should show: responsible team, assigned person, due date, dependency, issue, project impact.
Project Timeline / Milestones
Milestones: Contract Award, Technical Preparation, Sample/Analysis, Technical Proposal, Client Approval, Execution Readiness, Mobilization, Field Execution, Performance Verification, Technical Completion, Client Validation, Project Closure.
Each milestone should show: original date, forecast date, status, responsible team, dependency, delay reason, downstream impact.
Do not rely only on a basic Gantt chart. The impact of delays should be immediately understandable.
Change & Impact Management
Show: Change ID, title, source, date, description, status, Technical impact, Operations impact, Procurement/Logistics impact, Commercial impact, cost impact, timeline impact, affected milestone, Project Manager decision.
Example:
CR-003 – Additional Treatment Scope Requested
Source: Client, Status: Impact Review, Technical: Additional Assessment Required, Operations: +3 Execution Days, Procurement: Additional Material/Chemical Required, Commercial: Additional Cost Review Required, Timeline Impact: +3 Days, PM Decision: Pending.
Change Detail Page
Show: original scope, requested change, reason, requested by, date requested, Technical assessment, Operations assessment, Procurement/Logistics assessment, Commercial assessment, cost impact, timeline impact, affected milestones, required actions, linked documents, responsible parties, PM decision, decision history.
Buttons: Review Impact, Approve, Reject, Request Clarification, Escalate.
All buttons should work.
Main Demo Scenario
Use one connected scenario throughout the prototype:
The Client requests additional treatment scope after the project has started.
Flow:
Client request received → Change logged → Technical assesses technical impact → Procurement/Logistics checks additional material/chemical requirement → Operations assesses manpower/equipment/execution impact → Commercial assesses additional cost → Combined impact goes to Project Manager → Project Manager approves/rejects/requests clarification/escalates → Project timeline, status, and actions update → Activity history records the decision.
This scenario should demonstrate communication, responsibility, timeline control, and cost control together.
Issues & Risks
Use examples such as: material/chemical delivery delay, client approval delay, incomplete client information, additional sample analysis, technical-test delay, equipment availability issue, site-access issue, mobilization delay, field-execution delay.
Fields: issue title, category, severity, raised by, responsible team, assigned person, date raised, due date, affected milestone, timeline impact, cost impact, status, required action, PM attention required.
Statuses: Open, In Review, Waiting for Input, At Risk, Overdue, Resolved, Escalated.
Action & Responsibility Tracker
Show: action, linked project item, responsible team, assigned person, Project Manager/coordinator, due date, status, waiting on, priority, impact if late, next step.
Filters: My Decisions, Overdue, Waiting on Client, Waiting on Technical, Waiting on Operations, Waiting on Procurement, Waiting on Commercial, High Impact.
Ownership must be immediately clear.
Cost & Timeline Impact View
Show: item, source, original date, forecast date, days impacted, cost impact/exposure placeholder, reason, responsible team, affected milestone, review status, PM decision status.
Use mocked values only. Do not build detailed accounting functionality.
Activity / Project History
Show one traceable project history with events such as: client requested revised scope, Technical started assessment, Procurement updated material availability, Operations updated readiness, Commercial completed cost review, Project Manager approved change, forecast completion date updated.
Filters: All, PM Decisions, Technical, Operations, Commercial, Procurement, Client-Related.
This is a project activity/history view, not a chat system.
Documents / Technical Records
Mock document types: Client Technical Requirement, Sample Analysis, Lab Test Result, Technical Evaluation, Technical Proposal, Client Approval, Pilot Test Result, Field Report, Change Supporting Document, Technical Completion Report, Client Validation.
Show: document name, type, added by, date, related project stage, related change/issue, status.
No real storage is required.
Completion & Client Validation
Show: Technical Activities Complete, Field Execution Complete, Outstanding Issues, Outstanding Actions, Performance Documentation, Technical Completion Report, Client Review, Client Validation / Sign-Off, Commercial Closure Status, Project Closure.
Include a clear completion checklist.
Management Overview
Show: active projects, projects on track, projects at risk, delayed projects, major changes, major cost exposure, schedule exposure, projects waiting on Client, projects waiting on PM decision, escalated issues.
Management can drill into project information but does not replace the Project Manager.
Admin Dashboard
Admin can view/manage mocked: projects, users, roles, project phases, statuses, issue categories, change categories, technical stages, system activity.
Metrics: total projects, active projects, total users, open changes, open issues, overdue actions, projects at risk, completed projects.
Mock Data Examples
Client requests additional treatment scope, additional sample analysis required, technical proposal waiting on client information, material/chemical delivery delayed, additional material required after scope change, client technical approval pending, field mobilization delayed, equipment readiness issue, site-access delay, laboratory assessment completed, pilot/field validation completed, execution progress behind schedule, additional scope causing +3 days forecast impact, Commercial review required, technical completion report pending, client validation pending.
Use realistic Oil & Gas technical-operation examples throughout. Do not use generic SaaS examples.
UI/UX Direction
Professional, modern, enterprise Oil & Gas operations aesthetic: deep navy/dark blue, cyan/teal accents, white/light surfaces where appropriate, clean sidebar navigation, clear status hierarchy, professional tables, timelines, readiness views, impact summaries, responsibility views, decision panels, activity/history views.
The Project Manager Dashboard should feel like an operational command center while remaining simple and easy to understand.
Avoid excessive cards. Use a balanced mix of tables, timelines, status panels, readiness matrices, impact summaries, activity feeds, decision panels, and structured detail layouts.
All important navigation, filters, tabs, actions, and decision buttons must be clickable. Do not rely only on toast notifications.
What Not to Build
Generic construction software, construction claims portal, CRM, ERP clone, accounting software, WhatsApp/email replacement, messaging application, generic task-management system, real procurement system, laboratory-calculation software, chemical-dosage calculator, AI technical recommendation system, automated treatment recommendation, real document-management backend, Client portal, Supplier portal, live external integrations.
Technical and engineering decisions must remain with the company's specialists.
Acceptance Criteria
1. Demonstrates the project-execution visibility concept end-to-end.
2. Project Manager is clearly the central coordinator and project-level decision owner.
3. Technical, Operations, Commercial, Procurement/Logistics, Management, and Admin roles remain clearly separated.
4. Client and Supplier are represented as external dependencies, not internal roles.
5. Demonstrates all four confirmed problems: delivery timeline, communication, ownership/responsibility, cost/timeline control.
6. Includes one realistic project from contract award through technical preparation, execution, completion, and client validation.
7. Includes the sample/information → analysis → technical proposal → approval → execution flow.
8. Demonstrates one complete client scope-change scenario.
9. Technical owns technical assessment, Operations owns execution assessment, Procurement/Logistics owns supply/logistics assessment, Commercial owns commercial/cost assessment.
10. Project Manager receives the combined impact and records the project-level decision.
11. Dashboard clearly shows health, progress, risks, dependencies, overdue items, cost/timeline exposure, and required decisions.
12. Execution Readiness clearly shows technical, material/chemical, equipment, manpower, logistics, approval, site, and mobilization readiness.
13. Changes, issues, actions, documents, and decisions have clear ownership and traceability.
14. Completion and Client Validation workflow is included.
15. Management has high-level visibility without replacing the Project Manager.
16. Current largely manual workflow is respected; do not assume an existing ERP or workflow platform.
17. No real backend, integrations, AI model, database, document storage, email, WhatsApp, authentication, chemical calculations, or automated technical decisions.
18. Uses realistic Oil & Gas technical-operation terminology and mocked data.
19. Does not look like generic construction software, CRM, ERP, or generic SaaS.
20. All major screens, navigation, tabs, filters, actions, and decisions are clickable and presentation-ready.
Recommended Demo Flow
Login as Project Manager → Open active project → Review health, technical status, and execution readiness → See new client scope change → Open change → Review Technical impact → Review Procurement/Logistics impact → Review Operations impact → Review Commercial impact → See combined cost/timeline impact → Record Project Manager decision → Timeline/status/actions update → Activity history records decision → Continue through execution → Technical completion → Client validation/sign-off.
The complete demo should work without needing to explain missing screens manually.
Wajih, these abbreviations are just for your understanding:
1. PM – Project Manager
2. SOP – Standard Operating Procedure
3. FPSO – Floating Production Storage and Offloading
4. FSO – Floating Storage and Offloading
5. UI/UX – User Interface / User Experience
The main priority is:
One project change should clearly flow through Technical, Operations, Procurement/Logistics, Commercial, cost, and timeline, with the combined impact ultimately reaching the Project Manager for a clear project-level decision.