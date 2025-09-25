// Notion REST helper (MV3-safe)
const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// chrome.storage -> Promise
function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getNotionConfig() {
  const { notionApiKey, notionDatabaseId } = await storageGet(['notionApiKey', 'notionDatabaseId']);
  if (!notionApiKey) {
    console.error('Missing Notion API key in storage');
    throw new Error('Missing Notion API key. Set chrome.storage.sync.notionApiKey.');
  }
  if (!notionDatabaseId) throw new Error('Missing Notion database ID. Set chrome.storage.sync.notionDatabaseId.');
  return { notionApiKey, notionDatabaseId };
}

// Minimal property map — change these to match your DB
const defaultProps = {
  company: 'Company Name',   // rich_text
  position: 'Position', // rich_text
  status: 'Status',     // select
  applicationDate: 'Application Date', // date
  location: 'Location', // rich_text
};

function buildProperties(job, propMap = defaultProps) {
  const props = {};

  // Position (optional, explicit field)
  const positionText = job.position || job.title || job.role;
  if (positionText && propMap.position) {
    props[propMap.position] = { rich_text: [{ text: { content: positionText } }] };
  }

  if (job.company) {
    props[propMap.company] = { title: [{ text: { content: job.company } }] };
  }
  if (job.status) {
    props[propMap.status] = { select: { name: job.status } };
  }
  if (job.applicationDate) {
    const date = String(job.applicationDate).slice(0, 10);
    console.log('Mapping applicationDate:', date);
    props[propMap.applicationDate] = { date: { start: date } };
  }
  if (job.location) {
    props[propMap.location] = { rich_text: [{ text: { content: job.location } }] };
  }

  return props;
}


export async function saveJobToNotion(job) {
  const { notionApiKey, notionDatabaseId } = await getNotionConfig();

  const payload = {
    parent: { database_id: notionDatabaseId },
    properties: buildProperties(job),
  };

  const res = await fetch(`${NOTION_API_BASE}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Notion API error:', res.status, text);
    throw new Error(`Notion API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
