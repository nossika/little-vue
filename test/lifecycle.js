import Vue from '../src/index';
describe('little-vue lifecycle test', () => {
    it('check lifecycle', async (done) => {
        let vm = new Vue({
            el: document.createElement('div'),
            template:
                `<div>
                    <span id="data">{{ text }}</span>
                    <span id="computed">{{ textLen }}</span>
                    <span id="v-bind" :attr="attr"></span>
                    <span id="v-if">
                        <span v-if="true" data-true></span>
                        <span v-if="false" data-false></span>
                    </span>
                    <span id="v-on" @click="onClick"></span>
                    <span id="arr">{{ JSON.stringify(arr[arr.length - 1]) }}</span>
                </div>`,
            data: {
                text: 'text',
                attr: 'attr',
                clicked: false,
                arr: ['a', 'r', 'r'],
            },
            computed: {
                textLen () {
                    return this.text.length;
                }
            },
            methods: {
                onClick () {
                    this.clicked = true;
                }
            },
            created () {
                expect(this.$el.querySelector('#data').innerText).toBe('{{ text }}');
            },
            mounted () {
                expect(this.$el.querySelector('#data').innerText).toBe('text');
                done();
            },
        });
    });
});
