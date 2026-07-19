import { dowHeaders, isMultiDay } from '../utils/calendar';

let MAX_SLIVERS = 2;

export default function CalendarGrid({ weeks, events, categoriesById, todayIso, selectedIso, onSelectDay }) {
  let spans = events.filter(isMultiDay);
  let singles = events.filter((e) => !isMultiDay(e));

  let eventsByDay = {};
  singles.forEach((e) => {
    if (!eventsByDay[e.startDate]) eventsByDay[e.startDate] = [];
    eventsByDay[e.startDate].push(e);
  });

  return (
    <div>
      <div className="dow">
        {dowHeaders().map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid">
        {weeks.map((week, wi) => {
          let bars = [];
          spans.forEach((s) => {
            let cols = [];
            week.forEach((cell, idx) => {
              if (cell.iso >= s.startDate && cell.iso <= s.endDate) cols.push(idx);
            });
            if (!cols.length) return;
            let first = cols[0];
            let last = cols[cols.length - 1];
            let category = categoriesById[s.categoryId] || { color: 'var(--dim)' };
            bars.push(
              <div
                key={s._id}
                className={
                  'bar' +
                  (week[first].iso > s.startDate ? ' cont-left' : '') +
                  (week[last].iso < s.endDate ? ' cont-right' : '')
                }
                style={{
                  background: category.color,
                  left: `calc(${first} * 100% / 7 + 2px)`,
                  width: `calc(${last - first + 1} * 100% / 7 - 4px)`,
                }}
                title={s.title}
              >
                {s.title}
              </div>
            );
          });

          return (
            <div className={'week' + (bars.length ? ' has-lane' : '')} key={wi}>
              {bars}
              {week.map((cell) => {
                let dayEvents = eventsByDay[cell.iso] || [];
                let classes = ['cell'];
                if (!cell.inMonth) classes.push('dim');
                if (cell.iso === todayIso) classes.push('today');
                if (cell.iso === selectedIso) classes.push('selected');

                return (
                  <div key={cell.iso} className={classes.join(' ')} onClick={() => onSelectDay(cell.iso)}>
                    <div className="datenum">
                      {cell.iso === todayIso ? <b>{cell.dayNum}</b> : cell.dayNum}
                    </div>
                    <div className="ev-stack">
                      {dayEvents.slice(0, MAX_SLIVERS).map((e) => {
                        let category = categoriesById[e.categoryId] || { color: 'var(--dim)' };
                        return (
                          <div key={e._id} className="ev" style={{ background: category.color }}>
                            {e.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > MAX_SLIVERS && (
                        <div className="more">+{dayEvents.length - MAX_SLIVERS} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
