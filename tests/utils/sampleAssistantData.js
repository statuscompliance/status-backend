export const sampleAssistants = [
  {
    assistantId: 'asst_1234567890',
    name: 'Code Assistant',
    instructions: 'Write and debug code in Python and JavaScript.',
    tools: '[{type:\'code_interpreter\'}]',
    model: 'gpt-4-0125-preview',
    status: 'ACTIVE',
  },
  {
    assistantId: 'asst_0987654321',
    name: 'Data Analysis Assistant',
    instructions: 'Analyze data and create visualizations.',
    tools: '[{type:\'retrieval\'}]',
    model: 'gpt-3.5-turbo-0125',
    status: 'INACTIVE',
  },
  {
    assistantId: 'asst_qwertyuiop',
    name: 'Writing Assistant',
    instructions: 'Help with writing tasks, such as generating content, editing, and proofreading.',
    tools: '[]',
    model: 'gpt-3.5-turbo-1106',
    status: 'ACTIVE',
  },
  {
    assistantId: 'asst_poiuytrewq',
    name: 'Customer Support Assistant',
    instructions: 'Answer customer questions and provide support.',
    tools: '[{type:\'knowledge_retrieval\'}]',
    model: 'gpt-4-0125-preview',
    status: 'INACTIVE',
  },
];
