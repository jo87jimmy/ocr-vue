import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import OCRDetect from '../OCRDetect.vue'

describe('OCRDetect', () => {
  it('renders properly', () => {
    const wrapper = mount(OCRDetect, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
