import React from 'react';
import './App.css';
import BetterMap from './components/BetterMap';
import * as clubs from './data/clubs.json'
import * as filteredTags from './data/filtered_tags.json'
var _ = require('lodash');

function isMobile() {
  var match = window.matchMedia || window.msMatchMedia;
  if(match) {
      var mq = match("(pointer:coarse)");
      return mq.matches;
  }
  return false;
}

const GetTagsFromClubs = (clubs) => {
  let allTags = _.flatten(Object.values(clubs).map(club => club.tags))
  let tagsCount = _.countBy(allTags, x => x)
  let tagsSorted = _.sortBy(_.uniq(allTags), tag => -1 * tagsCount[tag])
  return isMobile() ? tagsSorted.slice(0, 20) : tagsSorted
}

function App() {
  const availableTags = GetTagsFromClubs(clubs)
  const [selectedTags, setSelectedTags] = React.useState([])
  const [selectedClubs, setSelectedClubs] = React.useState([])
  React.useEffect(() => {
    if(selectedTags.length === 0) {
      setSelectedClubs(Object.values(clubs))
      return
    }
    setSelectedClubs(Object.values(clubs).filter(club => _.intersection(club.tags, selectedTags).length > 0))

  }, [selectedTags])
  function toggleTag(tag) {
    if(selectedTags.indexOf(tag) > -1) {
      let newArr = _.without(selectedTags, tag)
      setSelectedTags(newArr)
    } else {
      setSelectedTags([tag, ...selectedTags])
    }
  }
  return (
    <div className="App">
      <div className={"available-tags"}>
        <div className={"tags-container"}>
          {availableTags.map((tag, idx) => (
          <div key={idx} 
                className={(selectedTags.indexOf(tag) === -1 ? ["pointer not-selected"] : ["pointer selected"])} 
                onClick={() => toggleTag(tag)}
                >
            {tag}
            </div>))}
        </div>
      </div>
        <BetterMap clubs={selectedClubs} selectedTags={selectedTags}/>
    </div>
  );
}

export default App;
