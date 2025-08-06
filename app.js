const commentsContainer = document.getElementById('comments-container');
const form = document.getElementById('comment-form');
const nameInput = document.getElementById('name-input');
const commentInput = document.getElementById('comment-input');

// จำลองฐานข้อมูลในหน่วยความจำ
let comments = [
    { id: Date.now(), name: "Alice", text: "นี่คือคอมเมนต์แรก!", date: new Date().toISOString().split('T')[0] }
];

// รับข้อมูลจากแบบฟอร์ม
form.addEventListener('submit', e => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const text = commentInput.value.trim();

    // ตรวจสอบคำต้องห้าม
    const forbiddenPatterns = [/<script.*?>.*?<\/script>/gi, /<.*?>/g];
    if (forbiddenPatterns.some(pattern => pattern.test(text) || pattern.test(name))) {
        alert("⚠️ ตรวจพบคำต้องห้าม เช่น <script> หรือ HTML tags อื่น ๆ กรุณาตรวจสอบข้อความของคุณ");
        return;
    }

    if (!name || !text) {
        alert("กรุณากรอกทั้งชื่อและข้อความ");
        return;
    }

    const newComment = {
        id: Date.now(),
        name,
        text,
        date: new Date().toISOString().split('T')[0]
    };
    comments.push(newComment);
    renderComments();
    form.reset();
});

// แสดงคอมเมนต์แบบปลอดภัย
function renderComments() {
    commentsContainer.innerHTML = '';
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';

        const nameElement = document.createElement('strong');
        nameElement.textContent = comment.name;

        const textElement = document.createElement('span');
        textElement.textContent = `: ${comment.text}`;

        const dateElement = document.createElement('small');
        dateElement.textContent = ` (${comment.date})`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'ลบ';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = () => {
            comments = comments.filter(c => c.id !== comment.id);
            renderComments();
        };

        commentElement.appendChild(nameElement);
        commentElement.appendChild(textElement);
        commentElement.appendChild(dateElement);
        commentElement.appendChild(deleteButton);

        commentsContainer.appendChild(commentElement);
    });
}

renderComments();