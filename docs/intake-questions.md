# Intake Interview Questions

The intake interview gathers information to help the AI provide personalized relationship guidance. This is NOT a wellness check-in—it's an onboarding process to understand the person's background, communication patterns, and relationship context.

## Design Principles

1. **Progressive disclosure** - Start with easy questions, go deeper over time
2. **Non-blocking** - Users can start using the app immediately, intake can be completed incrementally
3. **Returnable** - Users can add/update information anytime
4. **Contextual** - Questions adapt based on previous answers
5. **Therapeutic framing** - Questions are phrased to encourage reflection, not just data collection

---

## Section 1: Relationship Basics
*Essential context - should be gathered early*

### 1.1 Relationship Status
- How would you describe your current relationship status? (Dating, Engaged, Married, Domestic Partnership, Other)
- How long have you been together?
- Do you live together? If so, for how long?

### 1.2 Partner Basics
- What is your partner's name or how should I refer to them?
- What are their pronouns?

### 1.3 Life Stage
- Your age range (for context on life stage)
- Do you have children together? From previous relationships?
- Any major life transitions happening? (new job, relocation, health changes, retirement, etc.)

---

## Section 2: Communication Patterns
*Core information for providing tailored advice*

### 2.1 Your Communication Style
- When a conflict arises, what's your first instinct?
  - Talk it out immediately
  - Need time to process first
  - Avoid the conversation
  - Depends on the situation
- How comfortable are you expressing negative emotions (anger, frustration, sadness)?
  - Very comfortable
  - Somewhat comfortable
  - Uncomfortable - I tend to hold things in
  - I express them but regret how I do it
- Do you tend to be more direct or indirect when raising concerns?

### 2.2 Your Partner's Communication Style (your perception)
- How does your partner typically respond when you raise a concern?
- Do they tend to be more direct or indirect?
- How do they handle being criticized or receiving feedback?

### 2.3 Conflict Dynamics
- What typically happens during a disagreement between you two?
  - We discuss calmly and resolve it
  - One person shuts down while the other pursues
  - It escalates into an argument
  - We avoid it and it goes unresolved
  - It varies depending on the topic
- After a disagreement, how long does it typically take to reconnect?
- Who usually initiates reconciliation?

---

## Section 3: Common Friction Areas
*Helps identify patterns and recurring themes*

### 3.1 Frequent Topics of Disagreement
Select all that apply:
- [ ] Household responsibilities (chores, mental load)
- [ ] Finances (spending, saving, financial priorities)
- [ ] Time together vs. apart
- [ ] Work-life balance
- [ ] Parenting approaches
- [ ] Extended family/in-laws
- [ ] Intimacy and physical affection
- [ ] Future plans (marriage, children, career, location)
- [ ] Social life and friendships
- [ ] Technology/screen time
- [ ] Communication itself
- [ ] Trust issues
- [ ] Other: ___

### 3.2 Underlying Needs
When conflicts arise, what do you most need from your partner?
- To feel heard and understood
- To feel appreciated and valued
- To feel prioritized
- To feel respected
- To feel supported
- To have space and autonomy
- Other: ___

---

## Section 4: Relationship History & Patterns
*Deeper context - can be gathered over time*

### 4.1 Relationship Journey
- What brought you two together initially?
- What are the strongest aspects of your relationship?
- What has been the most challenging period in your relationship?
- Have you done couples therapy or counseling before? If so, what was helpful or unhelpful?

### 4.2 Pattern Recognition
- Are there conflicts that seem to repeat, even when the specific topic changes?
- Do you notice yourself or your partner falling into predictable roles during disagreements?
- Is there something from past relationships (romantic or family) that you find yourself repeating?

---

## Section 5: Family of Origin
*Background context - helps understand default patterns*

### 5.1 Early Models
- How did your parents/caregivers handle conflict with each other?
  - They discussed things calmly
  - One was dominant, one avoided
  - There was frequent arguing
  - They didn't show conflict openly
  - They separated/divorced
  - Other: ___
- How was conflict handled between you and your parents growing up?
- What did you learn about relationships from watching the adults around you?

### 5.2 Attachment Context
- Growing up, did you generally feel:
  - Secure and supported
  - Like you had to take care of yourself emotionally
  - Anxious about whether people would be there for you
  - Mixed signals about closeness and distance
- How does this show up in your current relationship, if at all?

---

## Section 6: Personal Context
*Individual factors that affect relationship dynamics*

### 6.1 Stress & Life Circumstances
- What are your current major stressors outside the relationship?
- How do you typically cope with stress?
- Does stress affect how you show up in your relationship? How?

### 6.2 Support Systems
- Do you have people outside your relationship you can talk to about relationship challenges? (friends, family, therapist)
- Does your partner have their own support systems?

### 6.3 Mental Health Context (optional)
- Is there anything about your mental health that affects your relationship that you'd like me to know about? (anxiety, depression, ADHD, trauma history, etc.)
- Are you currently in individual therapy?

---

## Section 7: Goals & Growth
*Forward-looking - helps frame guidance*

### 7.1 Relationship Goals
- What does a thriving relationship look like to you?
- What's one thing you'd like to improve in your relationship?
- What's one thing you'd like to improve in yourself as a partner?

### 7.2 For This Platform
- What are you hoping to get from using this tool?
- Is there anything you want to make sure we cover or avoid?

---

## Implementation Notes

### Question Flow
1. **First session**: Sections 1 & 2 (basics and communication) - ~10-15 questions
2. **Second session**: Section 3 (friction areas) - ~5-8 questions
3. **Ongoing**: Sections 4-7 can be explored over time or triggered contextually

### Adaptive Questions
- If user mentions children → ask about parenting dynamics
- If user mentions past therapy → ask what worked/didn't
- If user mentions specific stressor → explore how it affects relationship
- If user describes conflict pattern → probe for underlying needs

### Data Storage
Each response should be stored with:
- `question_id`: Unique identifier
- `section`: Which section it belongs to
- `response`: User's answer
- `timestamp`: When answered
- `updated_at`: If user revises answer later

### Contextual Retrieval
When generating guidance, retrieve relevant intake data:
- Communication style for framing suggestions
- Known friction areas for pattern recognition
- Family of origin for understanding default reactions
- Stated goals for aligning recommendations

### Privacy Considerations
- Intake responses are individual (not shared with partner)
- Partner's intake informs AI but is never quoted directly to the other partner
- Sensitive topics (mental health, trauma) stored with extra care
