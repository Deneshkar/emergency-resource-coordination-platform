"""Retain supplied explanations and reconcile their summaries with personal C-series runs."""
import json,hashlib
from pathlib import Path
from paths import QMS
from member_support import member_config,write_json

questions=['What input changed?','What was expected?','What actually happened?','Which assertion or business rule explains the result?']
original={
1:[
'I changed the incident scenario from a High-priority incident with 1 available resource and 1 volunteer to a Medium-priority incident with 0 available resources and 0 volunteers.',
'I expected the agent to identify that resources and volunteers were unavailable and explain these shortages in the response plan. I also expected the plan to require human approval.',
'The agent identified that no resources or volunteers were available. It reported the missing vehicles and volunteers as constraints and generated a response plan that still required human approval. Both recorded scenarios passed.',
'The CoordinatorPlannerAgent must consider available resources and volunteers when preparing an incident response plan. If resources are missing, it must identify those limitations. Every response plan must require human approval before execution.'],
2:[
'I changed the scenario from a flood emergency with Medical stock of 20, Food stock of 100, and two shelters (10/10 and 30/100 occupied) to a routine assistance scenario with Medical stock of 50, Food stock of 100, and one full shelter (10/10 occupied).',
'I expected the urgency score to decrease, the medical stock shortage to disappear, and the agent not to select a shelter because the only available shelter was already full.',
'The urgency score decreased from 85 to 25. The medical resource deficit changed to false, and the agent returned `nearest_shelter = null` because no shelter had free capacity. Both scenarios passed.',
'The SituationAnalysisAgent must calculate urgency using incident conditions, identify resource shortages based on available stock, and select only shelters with spare capacity. A full shelter must not be selected.\n\nThe `nearest_shelter` field selects based on available capacity in this implementation, not geographical distance.'],
3:[
'I changed the dispatch scenario from a Medium-priority incident with 1 available resource and 1 volunteer to a High-priority incident with 0 available resources and 0 volunteers.',
'I expected the agent to identify missing resources, return an empty resource allocation, and change its recommendation from APPROVE to REVISE. I also expected human approval to remain required.',
'In the first scenario, the agent allocated an available response van, reported no resource gaps, and returned APPROVE.\n\nAfter the input changed, the agent returned an empty allocation and reported shortages of 2 Vehicles, 2 Medical resources, and 2 Personnel. Its recommendation changed to REVISE. Human approval was still required. Both scenarios passed.',
'The ResourceAllocationAgent must check resource availability against dispatch requirements. If sufficient resources are available, it can recommend APPROVE. If required resources are missing, it must report the shortages and recommend REVISE. Human approval is required before the dispatch is executed.']}
summaries={
1:[
'Available resources changed from one to zero and volunteers from one to zero. Priority remained High, with the same incident ID, title, category and affected count.',
'The supplied explanation expects the plan to identify resource and volunteer shortages while retaining human approval. That expectation matches the executed comparison.',
'Both scenarios passed. The changed plan reports no available resources and no available volunteers, identifies the missing vehicles and volunteers as constraints, and returns requiresHumanApproval=true.',
'The checks assert incidentId=7, requiresHumanApproval=true, and reasoning containing both shortage messages. The planner exposes constraints and proposes a response; it does not independently execute the plan.'],
2:[
'Medical stock increased from 20 to 50 and available vehicles from one to three. Food stayed at 100. Shelter 1 remained 10/10; shelter 2 changed from 30/100 to 100/100. The same High-priority flood incident remained in both inputs.',
'For this executed pair, the evidence-aligned expectation is that stock deficits clear and no shelter is selected, while urgency stays 85. The supplied expectation of lower urgency belongs to the older D-series pair, not this C-series run.',
'Both scenarios passed. Urgency was 85 in both. The original output selected shelter 2 and showed a medical deficit. The changed output returned nearest_shelter=null and all three resource-deficiency flags false.',
'The checks assert urgency_score=85, nearest_shelter=null, and false deficit flags after the change. Medical 50, food 100 and three vehicles meet the current baselines. Full shelters are excluded; eligible shelters are ranked by available capacity, not geographic distance.'],
3:[
'Priority changed from Medium to High, with available resources and volunteers each changing from one to zero. The input retained its explicit one-vehicle requirement.',
'The supplied expectation is an empty allocation, reported shortages and REVISE, while human approval remains required.',
'Both scenarios passed. The original output allocated a response van, returned no gaps and APPROVE. The changed output allocated nothing, reported gaps of two Vehicles, two Medical resources and two Personnel, and returned REVISE. Human approval remained true.',
'The checks assert empty/nonempty allocation and gap lists, requires_human_approval=true, and APPROVE/REVISE. In the current implementation, High priority replaces the explicit input requirement with the priority-based estimate. This comparison changes both priority and availability; it does not isolate their individual effects.'],
4:[
'Only the proposed shift start changed, from 10:00 to 09:30 UTC. The existing shift stayed 09:00-10:00, the proposed end stayed 11:00 and the volunteer remained available.',
'The previously supplied explanation identifies adjacent shifts as non-overlapping and the 09:30 start as a 30-minute conflict requiring revision.',
'Both personal scenarios passed. The adjacent case returned is_valid=true and APPROVE. The changed case returned is_valid=false, REVISE and V2_DOUBLE_BOOKING.',
'The checks assert those returned fields. Half-open intervals overlap when new_start < existing_end and existing_start < new_end. Equality at 10:00 is allowed. V2_DOUBLE_BOOKING is revisable; an agent recommendation does not itself approve the dispatch.']}
notes={
1:'The submitted High-to-Medium description matches the older M1-D01/M1-D02 examples. The supplied 8 October screenshot and raw personal run use M1-C01/M1-C02 and keep High priority. The summary below corrects that distinction; it is an edited evidence summary, not a verbatim member statement.',
2:'The submitted routine-assistance description and 85-to-25 urgency change match the older M2-D01/M2-D02 examples. The supplied personal run uses M2-C01/M2-C02: both incidents are the same High-priority flood, both scores are 85, and two shelters remain. The summary below corrects the distinction; the member should review these corrections before the viva.',
3:'The supplied explanation matches the personal run. Its submitted table labels D-series examples; the screenshot and dated comparison use M3-C01/M3-C02. The summary adds the observed High-priority requirement rule for clarity.',
4:'The prior supplied explanation is preserved verbatim in Understanding_Submitted_20261008.md. The following four-part summary combines it with the verified M4-C01/M4-C02 personal run. It is not a new verbatim statement.'}
personal=json.loads((QMS/'members/personal-changed-input-evidence.json').read_text())
technical=json.loads((QMS/'members/changed-input-evidence.json').read_text())
rows=[];combined='# Member explanations in submission order\n\nReceived through the group representative on 8 October 2026. Original statements are retained separately from evidence-aligned editorial summaries. Personal C-series runs are supported by supplied screenshots and raw records; the assessed viva remains separate.\n\n'
for number in range(1,5):
 folder,cfg=member_config(number);entry=next(e for e in personal['members'] if e['member']==number)
 source=folder/'Explanation_As_Submitted_20261008.md'
 if number<4:
  text='# '+cfg['name']+' explanation as supplied\n\nReceived via the group representative on 8 October 2026. Original wording retained; see the evidence reconciliation in Written_Explanation.md.\n\n'
  for q,a in zip(questions,original[number]):text+='## '+q+'\n\n'+a+'\n\n'
  source.write_text(text,encoding='utf-8')
 else:source=QMS/technical['deneshkar_explanation']['file']
 text=f"# Member {number} — {cfg['name']}\n\n{cfg['student_id']} | {cfg['component']} | {cfg['agent_class']}\n\n{notes[number]}\n\n"
 for q,a in zip(questions,summaries[number]):text+='## '+q+'\n\n'+a+'\n\n'
 text+='Personal scenario IDs: '+f'M{number}-C01 and M{number}-C02. Result: PASS / PASS.\n\n'
 text+='[Original submitted explanation]('+source.relative_to(folder).as_posix()+') | [Raw personal comparison]('+Path(entry['run']).relative_to(folder.relative_to(QMS)).as_posix()+')\n'
 out=folder/'Written_Explanation.md';out.write_text(text,encoding='utf-8')
 rows.append({'member':number,'name':cfg['name'],'student_id':cfg['student_id'],'component':cfg['component'],'agent':cfg['agent_class'],
              'scenario_ids':[f'M{number}-C01',f'M{number}-C02'],'run':entry['run'],'reconciliation':notes[number],
              'answers':dict(zip(questions,summaries[number])),
              'original':{'file':source.relative_to(QMS).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()},
              'summary':{'file':out.relative_to(QMS).as_posix(),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}})
 entry['written_explanation']='Received via group representative; evidence-aligned summary retained in Member_Explanations.md'+('; scenario corrections documented' if number<3 else '')
 combined+='## Member '+str(number)+' — '+cfg['name']+' / '+cfg['student_id']+'\n\n'+notes[number]+'\n\n'
 for q,a in zip(questions,summaries[number]):combined+='**'+q+'**\n\n'+a+'\n\n'
 combined+='[Full summary and original statement](../'+out.relative_to(QMS).as_posix()+')\n\n'
write_json(QMS/'members/member-explanations.json',{'received_on':'2026-10-08','members':rows,'viva_completed':False})
write_json(QMS/'members/personal-changed-input-evidence.json',personal)
(QMS/'submission/Member_Explanations.md').write_text(combined,encoding='utf-8')
print('Recorded members 1-4 in order; preserved originals and documented D-series versus C-series corrections.')
