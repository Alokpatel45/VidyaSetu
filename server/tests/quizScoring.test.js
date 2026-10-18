import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, submitAnswer, publicQuestion } from '../services/quizScoring.js';
const questions = [
  {question:'FIFO?',options:['Stack','Queue'],correctAnswer:'Queue',explanation:'Queue follows FIFO.'},
  {question:'LIFO?',options:['Stack','Queue'],correctAnswer:'Stack',explanation:'Stack follows LIFO.'}
];
const fresh = () => ({status:'in_progress',questions,answers:[],score:0});
test('grades correct and wrong answers',()=>{
 assert.equal(checkAnswer(questions[0],'Queue').isCorrect,true);
 assert.equal(checkAnswer(questions[0],'Stack').isCorrect,false);
});
test('does not reveal answer before check',()=>{
 assert.deepEqual(publicQuestion(questions[0]),{question:'FIFO?',options:['Stack','Queue']});
});
test('locks checked answers',()=>{
 const next=submitAnswer(fresh(),0,'Stack');
 assert.throws(()=>submitAnswer(next,0,'Queue'),/only once/);
});
test('auto-completes final answer with accurate score',()=>{
 const a=submitAnswer(fresh(),0,'Queue');
 const b=submitAnswer(a,1,'Queue');
 assert.equal(b.status,'completed');
 assert.equal(b.score,1);
 assert.equal(b.answers.length,2);
 assert.ok(b.completedAt);
 assert.throws(()=>submitAnswer(b,1,'Stack'),/already completed/);
});
test('rejects invalid option and out-of-order submission',()=>{
 assert.throws(()=>submitAnswer(fresh(),0,'Tree'),/Invalid answer option/);
 assert.throws(()=>submitAnswer(fresh(),1,'Stack'),/in sequence/);
});
