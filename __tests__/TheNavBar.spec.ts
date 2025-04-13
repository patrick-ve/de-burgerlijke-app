import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import TheNavBar from '~/components/TheNavBar.vue'

describe('TheNavBar', () => {
  it('renders', () => {
    render(TheNavBar)
  })
})
