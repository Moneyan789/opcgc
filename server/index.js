import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
// 静态文件：admin.html + marketplace.html + 主站资源
app.use(express.static(path.join(__dirname, '..')));

// ===== Auth Middleware =====
const ADMIN_TOKEN_KEY = 'admin_token';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === ADMIN_TOKEN_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ===== Auth =====
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');
  const storedHash = row?.value || '';

  if (hashPassword(password) === storedHash) {
    res.json({ token: ADMIN_TOKEN_KEY });
  } else {
    res.status(403).json({ error: 'Invalid password' });
  }
});

// ===== Projects =====
app.get('/api/projects', (req, res) => {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC').all();
  res.json(projects);
});

app.post('/api/projects', requireAuth, (req, res) => {
  const db = getDb();
  const { id, name, desc, link, contact, qrcode, qrcode2, status, statusClass } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM projects').get();
  const projectId = id || 'p' + Date.now();

  db.prepare(`INSERT INTO projects (id, name, desc, link, contact, qrcode, qrcode2, status, statusClass, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    projectId, name, desc || '', link || '', contact || '',
    qrcode || '', qrcode2 || '', status || '推广阶段', statusClass || '', maxOrder.next
  );
  res.json({ id: projectId });
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { name, desc, link, contact, qrcode, qrcode2, status, statusClass } = req.body;
  db.prepare(`UPDATE projects SET name=?, desc=?, link=?, contact=?, qrcode=?, qrcode2=?, status=?, statusClass=? WHERE id=?`)
    .run(name, desc, link, contact, qrcode, qrcode2, status, statusClass, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/projects/reorder', requireAuth, (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });

  const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
  ids.forEach((id, index) => stmt.run(index, id));
  res.json({ ok: true });
});

// ===== Submissions =====
app.get('/api/submissions', requireAuth, (req, res) => {
  const db = getDb();
  const submissions = db.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();
  res.json(submissions);
});

app.post('/api/submissions', (req, res) => {
  const db = getDb();
  const { name, contact, title, desc, files } = req.body;
  if (!name || !contact || !title || !desc) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const id = 's' + Date.now();
  const filesJson = JSON.stringify(files || []);
  db.prepare('INSERT INTO submissions (id, name, contact, title, desc, files) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, contact, title, desc, filesJson);
  res.json({ id });
});

app.post('/api/submissions/:id/approve', requireAuth, (req, res) => {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });

  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('approved', req.params.id);

  // Create project from submission
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM projects').get();
  const projectId = 'p' + Date.now();
  db.prepare('INSERT INTO projects (id, name, desc, contact, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(projectId, sub.title, sub.desc, sub.contact, '推广阶段', maxOrder.next);
  res.json({ projectId });
});

app.post('/api/submissions/:id/reject', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('rejected', req.params.id);
  res.json({ ok: true });
});

// ===== FAQ QR =====
app.get('/api/faq-qr', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM faq_qr WHERE id = 1').get();
  res.json(row || {});
});

app.put('/api/faq-qr', requireAuth, (req, res) => {
  const db = getDb();
  const { qr1, qr2, label1, label2 } = req.body;
  db.prepare('UPDATE faq_qr SET qr1=?, qr2=?, label1=?, label2=? WHERE id=1')
    .run(qr1 || '', qr2 || '', label1 || '扫码进群', label2 || '联系创始人');
  res.json({ ok: true });
});

// ===== Cases =====
app.get('/api/cases', (req, res) => {
  const db = getDb();
  const cases = db.prepare('SELECT * FROM cases ORDER BY sort_order ASC, created_at ASC').all();
  res.json(cases);
});

app.post('/api/cases', requireAuth, (req, res) => {
  const db = getDb();
  const { id, tag, title, description, result } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM cases').get();
  const caseId = id || 'c' + Date.now();
  db.prepare('INSERT INTO cases (id, tag, title, description, result, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(caseId, tag || '', title, description || '', result || '', maxOrder.next);
  res.json({ id: caseId });
});

app.put('/api/cases/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { tag, title, description, result } = req.body;
  db.prepare('UPDATE cases SET tag=?, title=?, description=?, result=? WHERE id=?')
    .run(tag, title, description, result, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/cases/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/cases/reorder', requireAuth, (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
  const stmt = db.prepare('UPDATE cases SET sort_order = ? WHERE id = ?');
  ids.forEach((id, index) => stmt.run(index, id));
  res.json({ ok: true });
});

// ===== Auto-seed defaults on startup =====
const DEFAULT_PROJECTS = [
  { id: 'p1', name: '柏康到家', desc: '一站式线上购药平台。26年5月上线，目前为推广阶段，此商城是 BtoBtoC 模式。', link: '#', contact: '', qrcode: '', qrcode2: '', status: '推广阶段', statusClass: '' },
  { id: 'p2', name: 'AI装企智能体', desc: '此项目为众筹项目，针对装修公司的一款全链接智能体，目前为初期预热阶段。', link: '#', contact: '', qrcode: '', qrcode2: '', status: '初期预热', statusClass: 'pre' },
  { id: 'p3', name: '项目待定', desc: '此项目点位预留中，欢迎有想法的伙伴提交共创方案，抱团落地。', link: '', contact: '', qrcode: '', qrcode2: '', status: '预留点位', statusClass: 'reserved' }
];

const DEFAULT_CASES = [
  { id: 'c1', tag: '实体商家', title: '社区餐饮店 7 天获客 300+', description: '商圈成员帮助本地餐饮店用 AI 生成短视频脚本与朋友圈海报，结合同城社群分发，7 天内新增精准顾客 300 余人。', result: '获客成本降低 60%' },
  { id: 'c2', tag: '个人创业', title: 'AI 简历优化副业月入过万', description: '上班族利用商圈提供的 AI 工具账号与运营指导，开辟简历优化服务，第一个月即实现稳定营收。', result: '单月营收突破 1.2W' },
  { id: 'c3', tag: '项目孵化', title: '同城便民小程序 2 周上线', description: '从技术、设计到运营，商圈内成员共同协作，2 周内完成同城便民信息小程序的 MVP 开发与上线测试。', result: '开发周期缩短 70%' }
];

function autoSeed() {
  try {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    if (count === 0) {
      const stmt = db.prepare(`INSERT INTO projects (id, name, desc, link, contact, qrcode, qrcode2, status, statusClass, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      DEFAULT_PROJECTS.forEach((p, i) => stmt.run(p.id, p.name, p.desc, p.link, p.contact, p.qrcode, p.qrcode2, p.status, p.statusClass, i));
      console.log('Seeded ' + DEFAULT_PROJECTS.length + ' default projects');
    }
    const caseCount = db.prepare('SELECT COUNT(*) as c FROM cases').get().c;
    if (caseCount === 0) {
      const stmt2 = db.prepare('INSERT INTO cases (id, tag, title, description, result, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
      DEFAULT_CASES.forEach((c, i) => stmt2.run(c.id, c.tag, c.title, c.description, c.result, i));
      console.log('Seeded ' + DEFAULT_CASES.length + ' default cases');
    }
  } catch (e) {
    console.warn('Auto-seed skipped:', e.message);
  }
}

// ===== Start =====
initDb().then(() => {
  autoSeed();
  app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
