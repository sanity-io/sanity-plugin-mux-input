import React from 'react'
import client from 'part:@sanity/base/client'
import Button from 'part:@sanity/components/buttons/default'
import styles from './SelectAsset.css'
import getPosterSrc from '../util/getPosterSrc'

const PER_PAGE = 200

function createQuery(start = 0, end = PER_PAGE) {
  return `*[_type == "mux.videoAsset"] | order(_updatedAt desc) [${start}...${end}] {_id, playbackId, thumbTime}`
}

export default class SelectAsset extends React.Component {
  state = {
    assets: [],
    isLastPage: false,
    isLoading: false
  }

  pageNo = 0

  fetchPage(pageNo) {
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE
    this.setState({isLoading: true})
    return client.fetch(createQuery(start, end)).then(result => {
      this.setState(prevState => ({
        isLastPage: result.length === 0,
        assets: prevState.assets.concat(result),
        isLoading: false
      }))
    })
  }

  componentDidMount() {
    this.fetchPage(this.pageNo)
  }

  select(id) {
    const selected = this.state.assets.find(doc => doc._id === id)
    if (selected) {
      this.props.onSelect(selected)
    }
  }

  handleItemClick = event => {
    event.preventDefault()
    this.select(event.currentTarget.getAttribute('data-id'))
  }

  handleItemKeyPress = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.select(event.currentTarget.getAttribute('data-id'))
    }
  }
  handleFetchNextPage = () => {
    this.fetchPage(++this.pageNo)
  }

  handleImageError = event => {
    const imageElm = event.currentTarget
    imageElm.src =
      'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNDggNDgiIHZlcnNpb249IjEuMSIgeD0iMHB4IiB5PSIwcHgiPjx0aXRsZT5JY29ucyAvIEdlbmVyYWwgLyBMYXJnZSAvIFVua25vd248L3RpdGxlPjxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPjxnIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnPjxwYXRoIGQ9Ik0yOS42MTQ1OTYxLDYuNSBMMzcuNSwxNC4zMjUwNjUgTDM3LjUsMzkuMzI2NDQ0NyBDMzcuNSw0MC41Mjk0ODk3IDM2LjUzMDMzNjYsNDEuNSAzNS4zMjM3MzA1LDQxLjUgTDExLjY3NjI2OTUsNDEuNSBDMTAuNDc0MTY5Niw0MS41IDkuNSw0MC41MjU4OTM3IDkuNSwzOS4zMjM1NjAxIEw5LjUsOC42NzY0Mzk5MiBDOS41LDcuNDc1MjA3OTYgMTAuNDY5NTU4MSw2LjUgMTEuNjU4MDg4Nyw2LjUgTDI5LjYxNDU5NjEsNi41IFoiIHN0cm9rZT0iIzAwMDAwMCI+PC9wYXRoPjxwb2x5Z29uIGZpbGw9IiMwMDAwMDAiIHBvaW50cz0iMjkgOCAzNSAxNCAyOSAxNCI+PC9wb2x5Z29uPjxwYXRoIGQ9Ik0yMS40NTY1NzU5LDI4LjkwMTg1NjggQzIxLjQ1NjU3NTksMjguNTk0MTYyOSAyMS41NjA5NzA4LDI4LjMzNDIxODYgMjEuNzY5NzYzNywyOC4xMjIwMTU5IEMyMS45Nzg1NTY2LDI3LjkwOTgxMzMgMjIuMjMxNzE0MiwyNy44MDM3MTM1IDIyLjUyOTI0NDEsMjcuODAzNzEzNSBDMjIuODI2Nzc0LDI3LjgwMzcxMzUgMjMuMDc5OTMxNiwyNy45MDk4MTMzIDIzLjI4ODcyNDUsMjguMTIyMDE1OSBDMjMuNDk3NTE3NCwyOC4zMzQyMTg2IDIzLjYwMTkxMjMsMjguNTk0MTYyOSAyMy42MDE5MTIzLDI4LjkwMTg1NjggQzIzLjYwMTkxMjMsMjkuMjA5NTUwNiAyMy40OTc1MTc0LDI5LjQ2OTQ5NSAyMy4yODg3MjQ1LDI5LjY4MTY5NzYgQzIzLjA3OTkzMTYsMjkuODkzOTAwMyAyMi44MjY3NzQsMzAgMjIuNTI5MjQ0MSwzMCBDMjIuMjMxNzE0MiwzMCAyMS45Nzg1NTY2LDI5Ljg5MzkwMDMgMjEuNzY5NzYzNywyOS42ODE2OTc2IEMyMS41NjA5NzA4LDI5LjQ2OTQ5NSAyMS40NTY1NzU5LDI5LjIwOTU1MDYgMjEuNDU2NTc1OSwyOC45MDE4NTY4IFogTTIwLjkzOTgxNiwxOC45MDcxNjE4IEMyMS41NzY2MzQ0LDE4LjMwMjM4NDIgMjIuNDI0ODQyOSwxOCAyMy40ODQ0NjY5LDE4IEMyNC41NDQwOTA5LDE4IDI1LjM5NDkwOTMsMTguMjk3MDc5MyAyNi4wMzY5NDc1LDE4Ljg5MTI0NjcgQzI2LjY3ODk4NTcsMTkuNDg1NDE0MSAyNywyMC4zMjYyNTQ1IDI3LDIxLjQxMzc5MzEgQzI3LDIyLjUwMTMzMTcgMjYuNjkyMDM1MSwyMy4yOTQ0MjcyIDI2LjA3NjA5NiwyMy43OTMxMDM0IEMyNS40NjAxNTY5LDI0LjI5MTc3OTcgMjQuNTQ2NzAxNiwyNC41NDY0MTkgMjMuMzM1NzAyNywyNC41NTcwMjkyIEwyMy4zMzU3MDI3LDI2LjQ5ODY3MzcgTDIxLjY0NDQ4ODUsMjYuNDk4NjczNyBMMjEuNjQ0NDg4NSwyMy4zMTU2NDk5IEwyMi4zOTYxMzkzLDIzLjMxNTY0OTkgQzIzLjM3NzQ2NiwyMy4zMjYyNiAyNC4xMDU2MjAzLDIzLjE5NjI4NzggMjQuNTgwNjI0MiwyMi45MjU3Mjk0IEMyNS4wNTU2MjgxLDIyLjY1NTE3MTEgMjUuMjkzMTI2NSwyMi4xMjIwMTk5IDI1LjI5MzEyNjUsMjEuMzI2MjU5OSBDMjUuMjkzMTI2NSwyMC43NjM5MjI5IDI1LjEzMzkyNDMsMjAuMzIzNjA5IDI0LjgxNTUxNTEsMjAuMDA1MzA1IEMyNC40OTcxMDU5LDE5LjY4NzAwMTEgMjQuMDU2MDM3NSwxOS41Mjc4NTE1IDIzLjQ5MjI5NjYsMTkuNTI3ODUxNSBDMjIuOTI4NTU1NywxOS41Mjc4NTE1IDIyLjQ4NDg3NzQsMTkuNjgxNjk2MSAyMi4xNjEyNDg0LDE5Ljk4OTM4OTkgQzIxLjgzNzYxOTQsMjAuMjk3MDgzOCAyMS42NzU4MDczLDIwLjcyNjc4NzcgMjEuNjc1ODA3MywyMS4yNzg1MTQ2IEwyMC4wMDAyNTI2LDIxLjI3ODUxNDYgQzE5Ljk4OTgxMjksMjAuMzAyMzgyNCAyMC4zMDI5OTc2LDE5LjUxMTkzOTQgMjAuOTM5ODE2LDE4LjkwNzE2MTggWiIgZmlsbD0iIzAwMDAwMCI+PC9wYXRoPjwvZz48L2c+PC9zdmc+'
    imageElm.width = 100
    imageElm.height = 100
  }

  render() {
    const {assets, isLastPage, isLoading} = this.state
    return (
      <div className={styles.root}>
        <div className={styles.imageList}>
          {assets.map(asset => {
            const size = 80
            const width = 100
            const height = 100
            const posterUrl = getPosterSrc(asset.playbackId, {
              time: asset.thumbTime,
              fitMode: 'crop',
              width: 100,
              height: 100
            })
            return (
              <a
                key={asset._id}
                className={styles.item}
                data-id={asset._id}
                onClick={this.handleItemClick}
                onKeyPress={this.handleItemKeyPress}
                tabIndex={0}
                style={{
                  width: `${(width * size) / height}px`,
                  flexGrow: `${(width * size) / height}`
                }}
              >
                <i
                  className={styles.padder}
                  style={{paddingBottom: `${(height / width) * 100}%`}}
                />
                <img
                  onError={this.handleImageError}
                  src={posterUrl}
                  className={styles.image}
                  title={asset.filename || asset.playbackId}
                />
              </a>
            )
          })}
        </div>
        <div className={styles.loadMore}>
          {!isLastPage && (
            <Button onClick={this.handleFetchNextPage} loading={isLoading}>
              Load more
            </Button>
          )}
        </div>
      </div>
    )
  }
}
